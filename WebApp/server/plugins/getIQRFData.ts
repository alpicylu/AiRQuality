import { nitroApp } from "nitropack/dist/runtime/app";
import { scheduleJob } from 'node-schedule'
import { publicIpv4 } from 'public-ip'
import * as crypto from 'node:crypto'
import { stringify } from 'node:querystring'
import type { SensorDataType } from "../../types/types"
import { PrismaClient } from '@prisma/client'
import type { Sensor } from '@prisma/client'
import {minServerSensorPollDelay} from '~/constants/constants'
import {config} from 'dotenv' 
import { DateTime } from 'luxon'


const prisma = new PrismaClient()
config()

const FRONT_DEV_MODE = true //setting this to true turns off the server (that is everything from polling to saving to DB)
const SEND_READ_REQ_TO_SENSORS = false //Should the server issue an "uplc" request to the sensors?
//setting this to false will only download readings from IQRFC

var sensorList: Sensor[] //gets a list of all available sensors

/*
You need to fetch as many new records as available.
The reason is that the "uplc" fetch will produce at least 2 responses on the IQRF cloud - the confirmation and actual sensor data.
Additionally, you need to take into accout all the other data that is sent to the server, like the "GW connected" one.
If you were to fetch only one record every "dnld" fetch, then you would not be able to keep up - more records would be produced
than you would be able to fetch, causing a catastrophic drift.
Catch as many records as you can and then filter them
*/
export default defineNitroPlugin( async(nitroApp) => {

    if (!FRONT_DEV_MODE) {
        // await prisma.reading.deleteMany({}) 

        sensorList = await getSensorList()
        //scheduleJob will make the passed-in function run in a specified interval (every N mins)
        //node-schedule does not prevent callback overrun by itself - if the callback takes longer than the schedule
        //interval, then a new task will begin before the previous one completed.
        //Im handling this by manually timing out (returning) the task if getting data from the server takes too long.
        //If the "dnld" command does not return within 6 retries, the callback returns with no response to the server
        const min = minServerSensorPollDelay
        scheduleJob(`*/${min} * * * *`, () => {
            pollSensors()
        })
    }
})

/*To make any requests to the IQRF cloud server, we need a signature, which confirms the legitimacy of the request.
It takes our API key, caller's IPv4 address, current timestamp seconds divided by 600 (valid for 10 mins) and the parameters
we send with the request. We take all of those and mash them through the md5 hash function.*/
// BIG TODO: How to secure sensitive data on the server
//How to provide TS type definitions: https://stackoverflow.com/questions/45247991/is-there-a-way-to-add-type-definition-globally-in-typescript-2 
//using an index signature to dynamically define object properties
async function constructSignature(parameter_part: string): Promise<string> {
    // const api_key = apiKey
    const api_key = process.env.API_KEY
    const publicIPv4Address: string = await publicIpv4() //good
    const timestamp: string = Math.round( (Date.now()/1000)/600 ).toString() //Date.now returns ms, we need s
    const signatureString: string = `${parameter_part}|${api_key}|${publicIPv4Address}|${timestamp}`
    return crypto.createHash('md5').update(signatureString).digest('hex')
}

async function constructURL(command: string, sensorIqrfId?: string): Promise<string> {
    if (command === "uplc" && sensorIqrfId === undefined) 
        throw new Error("The specified command is 'uplc', but no sensorIqrfId was specified")

    var query: {[key: string]: any} = {}
    query.ver = 2,
    query.uid = process.env.API_UID,
    query.gid = process.env.API_GID,
    query.cmd = command    

    switch (command){
        case "dnld":
            query.new = 1 
            break
        case "uplc":
            query.data = `${sensorIqrfId!}5E010140FFFFFFFF`
            break
    }

    const base = "https://cloud.iqrf.org/api/api.php?"
    const parameter_part = stringify(query)
    const signature = await constructSignature(parameter_part)
    return `${base}${parameter_part}&signature=${signature}`
}

/*This function will fetch relevant data (room and iqrfID) of all sensors from the DB */
async function getSensorList(): Promise<Sensor[]> {
    const sensors: Sensor[] = await prisma.sensor.findMany({})
    return sensors
}

//TODO my server should recognize when a request for data of a particular sensor has been sent
//but no sensor data were recieved - uplc was OK but i havnt fetched dnld for the sensor i polled.
async function pollSensors() {

    /*The below fetch will basically tell the cloud server "call the GW and ask it to get data
    from all sensors, then have it send that data back to the cloud"
    If this operation succeedes, data from sensors will await on the server, waiting to be fetched.
    This needs to be split into 2 fetches, because the response from this "uplc" fetch does not return sensor data,
    only OK/ERROR response */
    var atLeastOnePassed: boolean = false
    var failedRequests: Sensor[] = []

    //we are not asking sensors to read data, but we still want to fetch existing ones from IQRFC
    if (!SEND_READ_REQ_TO_SENSORS) atLeastOnePassed = true
    if (SEND_READ_REQ_TO_SENSORS) {
        await Promise.all(
            //returns an array of fetch promises
            sensorList.map(async (sensor) => $fetch<string>(await constructURL("uplc", sensor.iqrfId), {retry: 3, retryDelay: 1000}))
        )
        .then((res) => { //res is an array of values resolved from all provided Promises.
            if (res.length !== sensorList.length) throw new Error("More resolves were produced than there are sensors")
            res.forEach((el, i, self) => {
                atLeastOnePassed = atLeastOnePassed || (el === "OK;")
                //res and sensorList are always of the same lenght, so its safe to do that
                if (el !== "OK;") failedRequests.push(sensorList[i])
            })
            if (!atLeastOnePassed) throw new Error("IQRF cloud has not okay-ed any sensor data request - sensors have not been polled")
            return
        })
        .catch((err) => { //this catch will spring if all promises rejected.
            console.log(err)
            return 
        })

        if (failedRequests.length > 0){
            console.log("Some uplc requests failed:")
            console.log(failedRequests)
        }
    }

    /*If everything went smoothly during the last fetch, we are ready to get the acquired data from the cloud.
    Problem is, theres an indeterminate winidow of time between the Gateway registering the "uplc" call, and data
    actually being placed on the server - sending requests to GW, polling sensors, getting that data to GW and sending it to server
    all take time.
    So what i did here is attempt to get the sensor data every 10 seconds and repeat this process up to 6 times
    resulting in a max wait time of 1min. To achieve this behavior i needed to wrap the setInterval timer function
    in a promise. Had i not wrapped it so, the timered function would not block, and i want it to block because i want
    the server to wait for its data. */
    //TODO make this into setTimeout loop to avoid possible call interference
    if (atLeastOnePassed) await new Promise< (SensorDataType|null)[] >((resolve, reject) => {
        const repLimit = 4
        var reps = 0
        const repDelay = 1000*15

        /*Ask the server for the data periodically. If data is delivered, cancel the timer and resolve the promise. 
        Otherwise, repeat the request up to a limit, then reject the promise. */ 
        const intervalID = setInterval(async () => {
            $fetch<string>(await constructURL("dnld"))
            .then(res => {
                const parsedData = parseRawServerData(res)
                if (parsedData !== null){
                    clearInterval(intervalID)
                    resolve(parsedData)
                }
                //++reps has to be the first operand (see AND docs)
                else if (++reps === repLimit && parsedData === null){
                    clearInterval(intervalID)
                    reject(`Fetching sensor data from server failed (${repLimit} retries)`)
                }
                return
            })
            .catch(err => console.log(err))

        }, repDelay)
    })
    .then(async (res)=> {
        return await insertToDB(res)
    }) 
    .catch(console.error)

    return
}

/*Data fetched from the server has the following format:
RECORDS_MATCHED;;;\r\nINDEX;DATETIME;DATA\r\nINDEX...
This function deals with extracting info from this blob
I use a series of RegExes to filter relevat data. A singular data-string can contain data from multiple sensors
so i need to filter them out and extract the data.
 */
function parseRawServerData(rawData: string): Array<SensorDataType | null> | null {
    console.log("V--raw server data--V")
    console.log(rawData)
    console.log("^--raw server data--^")
    if (rawData === "0;;;\r\n") return null //no new data on the server

    var results: Array<SensorDataType | null> = []
    
    /*rawData is a string containing possibly many records. Every element in arr is one matched record.
    one matched record is the exact string matched + matched groups (matched substring, INDEX, DATETIME, DATA).
    For instance, arr[0][0] is the substring from rawData that contained the matched regex*/
    //           INDEX                 DATETIME               DATA
    const re1 = /(\d+);(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2});([A-F0-9]+);/g
    const arr = [...rawData.matchAll(re1)]
    //el[0] - the entire matched substring   el[1] - first matched group (record index)
    //el[2] - second (datetime) etc.
    arr.forEach((el, i, arr) => {
        var readings = parseSensorData(el[3])
        //IQRF Cloud is 1h+ compared to warsaw (Warsaw 20:00 -> IQRFC 21:00)
        //Turns out, IQRFC's server is not ahead - its in Czechia which has the same TZ as Poland
        //The sensors themselves are probably configured with their clock being +1h.
        // const localTimeOfReading = new Date(el[2])
        // localTimeOfReading.setHours(localTimeOfReading.getHours() - 1)

        const trueLocalReadingTime = DateTime.fromFormat(el[2], "yyyy-MM-dd HH:mm:ss", {zone: "Europe/Warsaw"}).minus({hours: 1})
        // Subtract 1h because all sensor readings are +1h compared to Poland/Warsaw    
        const readingTimeUTC = trueLocalReadingTime.toUTC()

        //DateTime of sensor readings is saved in UTC time according to ISO format (eg. 2024-04-05T09:00:00.000Z)
        if (readings !== null && readingTimeUTC.isValid) readings.time = readingTimeUTC.toISO() 
        results.push(readings)
    })
    return results
}

//we need to filter out responses that we dont really caer about, like "GW connected" or "talked to a sensor"
function filterSensorData(rawSensor: string): boolean {
    if (rawSensor.slice(0, 4) === "0000") return false //data sent by GW once it connects to the server
    //a propper sensor-message has a sequence of bytes: XXXX.5E.81.(0140|0150)
    const filterRex = /(\d{4})(5E81)(0140|0150)(00)(?:[A-Z0-9]+)/g
    const matches = [...rawSensor.matchAll(filterRex)][0]
    if (matches === undefined) return false
    //if matchAll does not find a match, it returns an empty list. Indexing an empty list results in undef. 

    //make a list of iqrfId from the sensor array and check if the fetched sensor is on said list.
    if (!sensorList.map((sensor) => sensor.iqrfId).includes(matches[1])) return false

    return true 
}

/*From parseRawServerData this function gets a string of 20-40 hexadecimal characters (up to 64 Bytes, 128 chars)
This string contains device ID, command that was issued, peripheral address, hardware profile, error code, DPA version
and finally the data that was sent from the sensor. We pretty much only care about the data and sensor ID. 
The data that this function gets is equivalent to 1 record from IQRF cloud*/
//TODO this approach will only work if the order of sensor readings does not change.
function parseSensorData(rawSensor: string): SensorDataType | null {
    if (!filterSensorData(rawSensor)) return null

    //Look up the sensor's docs - to get temperature from "raw" reading, multiply it by 0.0625 (to get C)
    //for humidity (in %) mult by 0.5, etc.
    //temperature, humidity, CO2, (optionally) battery
    const unitArray = [0.0625, 0.5, 1, 1]
    var sensorId: string = ""
    //split the data field into frames: metadata, temp, rh, co2, and optionally battery
    
    //indexes:       1                       2             3            4                      5
    //            sensorID          01     temp    80   humidity  02   co2          04      battery
    const re2 = /(\d{4})[A-F0-9]{12}01([A-F0-9]{4})80([A-F0-9]{2})02([A-F0-9]{4})(?:04(?<bat>[A-F0-9]{4}))?/g
    /*The reason for this [0] is that matchAll technically expects more than one substring to find patterns in.
    Since it gets only one string to work with, it will return matches only for this one string, resulting in
    only one element on the first "layer" of the array */
    const arr2 = [...rawSensor.matchAll(re2)][0] 
    sensorId = arr2[1] //arr2[0] is the entire substring that matched the regex
    //TODO Consider storing IQRFID as a dec or hexadec number instead of this wierd "0100" byteswapped hybrid
    const sensorReadings = arr2.slice(2,5) //we omit sensorID because we dont want to cahnge it at all - it gets added later
    if (arr2.groups?.bat !== undefined){
        sensorReadings.push(arr2.groups.bat) //TODO: test if this clause is robust
    }

    //if a frame is longer than 1 byte, read each frame from the end, byte-by-byte (due to little-endianiness)
    sensorReadings.forEach((el, i, arr) => {
        //each sensor reading has either 2 or 4 characters (1 or 2 bytes)
        if (el.length != 4 && el.length != 2) throw new Error("[Parse error]: sensor reading byte length invalid")
        if (el.length == 4){
            arr[i] = el.replace(/([A-F0-9]{2})([A-F0-9]{2})/g, "$2$1") //switch bytes with eachother
        }
    })

    //AT LONG LAST, translate hex values to dec
    //indexes: 0 - temp, 1 - humid, 2 - co2 (3 - battery)
    var valuesDecimal: number[] = []
    sensorReadings.forEach((el, i, arr) => {
        valuesDecimal[i] = parseInt(el, 16) * unitArray[i]
    })

    const result: SensorDataType = {
        time: "PLACEHOLDER",
        id: sensorId,
        temp: valuesDecimal[0],
        rehu: valuesDecimal[1],
        co2c: valuesDecimal[2]
    }

    return result
}

/*This server can get multiple data-bearing responses per request, so multiple records can be saved to DB at a time.
Every record that was transmited to the cloud (those marked as "Rx" in the iqrf cloud admin page) is downloaded.
Not every record contains useful data - some records basically tell the cloud, that a request was sent to the GW - those are useless to us.
After download the plugin determines which records contain sensor data, and which dont. Those that dont are simply 
represented as null. Those that do are treated as an object of type "SensorDataType"
Here, we get an array of data-bearing-objects and nulls (nulls are the boring, data-less records from IQRFCloud).
The interesting objects are saved to the DB. */
async function insertToDB(data: (SensorDataType | null)[]): Promise<void> {

    await Promise.all(
        data.map((element) => {
            if (element !== null)
                return $fetch(`/api/sensors/${element.id}/readings`, {
                    method: 'POST',
                    body: element
            })
        })
    )
    .then(res => console.log("Fetched sensor readings saved to DB"))
    .catch(err => {
        console.log("Some sensor data failed to be saved to DB")
        console.log(err)
    })
}  