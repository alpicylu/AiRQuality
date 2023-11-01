import { nitroApp } from "nitropack/dist/runtime/app";
import { scheduleJob } from 'node-schedule'
import { publicIpv4 } from 'public-ip'
import * as crypto from 'node:crypto'
import { stringify } from 'node:querystring'
import { env } from 'node:process'
import { apiKey, gid, uid } from "../API_key"
import { sensorDataType } from "../../types/types"
import { PrismaClient } from '@prisma/client'
import { fail } from "node:assert";
const prisma = new PrismaClient()

type Sensor = {
    iqrfId: number,
    name: string
}
//This is not secure, i know it, but cloud.iqrf's SSL cert has expired. With the certificate being not valid.
//the only option is to not verify their validity.
env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

/*BIG TODO
You need to fetch as many new records as available.
The reason is that the "uplc" fetch will produce at least 2 responses on the IQRF cloud - the confirmation and actual sensor data.
Additionally, you need to take into accout all the other data that is sent to the server, like the "GW connected" one.
If you were to fetch only one record every "dnld" fetch, then you would not be able to keep up - more records would be produced
than you would be able to fetch, causing a catastrophic drift.
Catch as many records as you can and then filter them

PLEASE DOCUMENT THIS CODE.
*/
export default defineNitroPlugin( async(nitroApp) => {

    prisma.reading.deleteMany() 
    //This list will be fetched only during the start of the server.
    //and it makes sense, since the sensor list wont be updated often (sensors getting added/removed)
    const sensorList = await getSensorList()

    //scheduleJob will make the passed-in function run in a specified interval (every 15 mins)
    //node-schedule does not prevent callback overrun by itself - if the callback takes longer than the schedule
    //interval, then a new task will begin before the previous one completed.
    //Im handling this by manually timing out (returning) the task if getting data from the server takes too long.
    //If the "dnld" command does not return within 6 retries, the callback returns with no response to the server
    scheduleJob('*/10 * * * * *', () => {
        pollSensors(sensorList)
    })

})

/*To make any requests to the IQRF cloud server, we need a signature, which confirms the legitimacy of the request.
It takes our API key, caller's IPv4 address, current timestamp seconds divided by 600 (valid for 10 mins) and the parameters
we send with the request. We take all of those and mash them through the md5 hash function.*/
async function constructSignature(parameter_part: string): Promise<string> {
    const api_key = apiKey
    const publicIPv4Address: string = await publicIpv4() //good
    const timestamp: string = Math.round( (Date.now()/1000)/600 ).toString() //Date.now returns ms, we need s
    const signatureString: string = `${parameter_part}|${api_key}|${publicIPv4Address}|${timestamp}`
    return crypto.createHash('md5').update(signatureString).digest('hex')
}

// BIG TODO: How to secure sensitive data on the server
//How to provide TS type definitions: https://stackoverflow.com/questions/45247991/is-there-a-way-to-add-type-definition-globally-in-typescript-2 
async function constructURL(command: string): Promise<string> {
    //using an index signature to dynamically define object properties
    //https://stackoverflow.com/questions/12710905/how-do-i-dynamically-assign-properties-to-an-object-in-typescript 
    var query: {[key: string]: any} = {}
    query.ver = 2,
    query.uid = uid,
    query.gid = gid,
    query.cmd = command    

    switch (command){
        case "dnld":
            query.from = 95083 //hardcoded to always get this one record 
            query.to = 95086
            // query.new = 1 //cloud internally keeps track of the last record i pulled
            // query.count = 1
            break
        case "uplc":
            query.data = "01005E010140FFFFFFFF"
            break
    }

    const base = "https://cloud.iqrf.org/api/api.php?"
    const parameter_part = stringify(query)
    const signature = await constructSignature(parameter_part)
    return `${base}${parameter_part}&signature=${signature}`
}

/*This function will fetch relevant data (room and iqrfID) of all sensors from the DB */
async function getSensorList(): Promise<Sensor[]> {
    const sensors: Sensor[] = await prisma.sensor.findMany({
        select: {
            iqrfId: true,
            name: true
        }
    })
    return sensors
}

async function pollSensors(sensorList: Sensor[]) {

    //TODO make it so that if at least one fetch passes, the function continues and informs on
    //which sensors failed
    //fire off all fetches in a loop and wait untill all return
    //maybe use Promise.all()?
    var atLeastOnePassed: boolean = false
    var failedRequests: Sensor[] = []
    await Promise.all(
        sensorList.map(async (sensor) => $fetch<string>(await constructURL("uplc"), {retry: 3, retryDelay: 1000}))
    )
    .then((res) => { //res as an array of values resolved from all provided Promises.
        //check if at lest one promise resolved with "OK;"
        //this will return true if at least 1 request produced "OK;"
        // return res.some( (el) => el === "OK;" )
        res.forEach((el, i, self) => {
            atLeastOnePassed = atLeastOnePassed || (el === "OK;")
            //EDIT: the order of fulfillment is the order the promises were passed, so i can use the "i" index.
            if (el !== "OK;") failedRequests.push(sensorList.at(i))
        })
    })
    .catch((err) => {
        console.log("The IQRFCloud could not properly recieve the data upload request for any of the sensors")
        console.log(err)
        return false
    }) 
    
    /*The below fetch will basically tell the cloud server "call the GW and ask it to get data
    from all sensors, then have it send that data back to the cloud"
    If this operation succeedes, data from sensors will await on the server, waiting to be fetched.
    This needs to be split into 2 fetches, because the response from this "uplc" fetch does not return sensor data,
    only OK/ERROR response */
    var responseValid: boolean = await $fetch<string>(await constructURL("uplc"), {retry: 3, retryDelay: 1000})
    .then(res => {
        return res === "OK;"
    }).catch(err=>{
        console.log(err)
        return false
    })

    // const responseValid = true

    /*If everything went smoothly during the last fetch, we are ready to get the aquired data from the cloud.
    Problem is, theres an indeterminate winidow of time between the Gateway registering the "uplc" call, and data
    actually being placed on the server - sending reqests to GW, polling sensors, getting that data to GW and sending it to server
    all take time.
    So what i did here is attempt to get the sensor data every 10 seconds and repeat this process up to 6 times
    resulting in a max wait time of 1min. To achieve this behavior i needed to wrap the setInterval timer function
    in a promise. Had i not wrapped it so, the timered function would not block, and i want it to block because i want
    the server to wait for its data. */
    if (responseValid) await new Promise< (sensorDataType|null)[] >((resolve, reject) => {
        const repLimit = 3
        var reps = 0
        const repDelay = 1000*10

        //TODO make this into setTimeout loop
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
        //If promise resolves, save fetched data to DB
        console.log(res)
        return await insertToDB(res)
    })  //else, catch the rejection
    .catch(err=>console.log(err))

    return
}

/*Data fetched from the server has the following format:
RECORDS_MATCHED;;;\r\nINDEX;DATETIME;DATA\r\nINDEX...
I use a series of RegExes to filter relevat data. A singular data-string can contain data from multiple sensors
so i need to filter them out and extract the data.
 */
function parseRawServerData(rawData: string): Array<sensorDataType | null> | null {
    console.log("V--raw server data--V")
    console.log(rawData)
    console.log("^--raw server data--^")
    if (rawData === "0;;;\r\n") return null //no new data on the server

    var sensorDataObj: sensorDataType
    var results: Array<sensorDataType | null> = []
    
    /*rawData is a string containing possibly many records. Every element in arr is one matched record.
    Each element in one matched record is the exact string matched + matched groups.
    For instance, arr[0][0] is the substring that contained the matched regex*/
    //           INDEX     DATE               TIME               DATA
    const re1 = /(\d+);(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2});([A-F0-9]+);/g
    const arr = [...rawData.matchAll(re1)]
    //el[0] - the entire matched substring   el[1] - first matched group (record index)
    //el[2] - second.... etc.
    arr.forEach((el, i, arr) => {
        const readings = parseSensorData(el[3])
        if (readings.length === 0){
            results.push(null)
        }
        else {
            results.push(sensorDataObj = {
                // time: new Date().toLocaleString([], {timeZone: "Poland"}), //not all browsers need to support timezones other than UTC
                //the above converts well, but data needs to be stored in ISO format, and the above is not iso
                //you could store in UTC and then display in local though.
                time: new Date().toISOString(),
                id: readings[0],
                temp: readings[1],
                rehu: readings[2],
                co2c: readings[3]
            })
        }
    })
    return results
}

//we need to filter out responses that we dont really caer about, like "GW connected" or "talked to a sensor"
function filterSensorData(rawSensor: string): boolean {
    if (rawSensor.slice(0, 4) === "0000") return false //data sent by GW once it connects to the server
    // else if (rawSensor.length != 32 && rawSensor.length != 38) return false //every crucial-data-containing message
    //a propper sensor-message-data-thing has a sequence of bytes: XXXX.5E.81.(0140|0150)
    const filterRex = /(\d{4})(5E81)(0140|0150)(00)(?:[A-Z0-9]+)/g
    const matches = [...rawSensor.matchAll(filterRex)][0]
    if (matches === undefined) return false //if matchAll does not find a match, it returns an empty list. Indexing an empty list results in undef.

    //TODO: at this point it should read the list of all available sensors from the db (0001, 0002, 0003, 0004)
    //and compare it with the \d{4}.
    if (matches[1] !== "0100") return false

    //the below checks are useless - the string would just not match if any of those was false
    //the regex would return an empty list, since we are trying to match some parts literally (5E81, etc)
    // if (matches[2] !== "5E81") return false
    // if (matches[3] !== "0140" && matches[3] !== "0150") return false
    // if (matches[4] !== "00") return false

    return true 
}

/*From parseRawServerData this function gets a string of 20-40 haxadecimal characters (up to 64 Bytes, 128 chars)
This string contains device ID, command that was issued, peripheral address, hardware profile, error code, DPA version
and finally the data that was sent from the sensor. We pretty much only care about the data and sensor ID. */
function parseSensorData(rawSensor: string): number[] {
    if (!filterSensorData(rawSensor)) return []

    //Look up the sensor's docs - to get temperature from "raw" reading, multiply it by 0.0625 (to get C)
    //for humidity (in %) mult by 0.5, etc.
    //I am technically treating the ID of a sensor as a measurement and storing it as number, but the code is a bit cleaner that way.
    //id, temperature, humidity, CO2, (optionally) battery
    const unitArray = [1, 0.0625, 0.5, 1, 1]
    //split the data field into frames: metadata, temp, rh, co2, and optionally battery
    //TODO this approach will only work if the order of sensor readings does not change.
    //indexes:       1                       2             3            4                      5
    //            sensorID          01     temp    80   humidity  02   co2          04      battery
    const re2 = /(\d{4})[A-F0-9]{12}01([A-F0-9]{4})80([A-F0-9]{2})02([A-F0-9]{4})(?:04(?<bat>[A-F0-9]{4}))?/g
    /*The reason for this [0] is that matchAll technically expects more than one substring to find patterns in.
    Since it gets only one string to work with, it will return matches only for this one string, resulting in
    only one element on the first "layer" of the array */
    const arr2 = [...rawSensor.matchAll(re2)][0]
    const sensorReadings = arr2.slice(1,5)
    if (arr2.groups !== undefined && arr2.groups.bat !== null){
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
    //result indexes: 0 - id, 1 - temp, 2 - humid, 3 - co2 (4 - battery)
    //TODO maybe make this function return the sensorDataType obj?
    var result: number[] = []
    sensorReadings.forEach((el, i, arr) => {
        result[i] = parseInt(el, 16) * unitArray[i]
    })
    return result
}

/*This server can get multiple data-bearing responses per request, so multiple records can be saved to DB at a time.
Every record that was transmited to the cloud (those marked as "Rx" in the iqrf cloud admin page) is downloaded.
Not every record contains useful data - some records basically tell the cloud, that a request was sent to the GW - those are useless to us.
After download the plugin determines which records contain sensor data, and which dont. Those that dont are simply 
represented as null. Those that do are treated as an object of type "sensorDataType"
Here, we get an array of data-bearing-objects and nulls (nulls are the boring, data-less records from IQRFCloud).
The interesting objects are saved to the DB. */
async function insertToDB(data: (sensorDataType | null)[]): Promise<void> {
    data.forEach(async (el, i, arr) => {
        if (el !== null) await prisma.sensor.upsert({
            where: { name: "C1 234" },
            create: {
                iqrfId: 1,
                name: "C1 234",
                readings: {
                    create: { //can i reference TS values in Prisma queries?
                        timestamp: el.time,
                        temp: el.temp,
                        rehu: el.rehu,
                        co2c: el.co2c,
                    }
                }
            },
            update: {
                readings: {
                    create: {
                        timestamp: el.time,
                        temp: el.temp,
                        rehu: el.rehu,
                        co2c: el.co2c,
                    }
                }
            }
        })
    })
}