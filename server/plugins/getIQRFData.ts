import { nitroApp } from "nitropack/dist/runtime/app";
import { scheduleJob } from 'node-schedule'
import { Md5 } from 'ts-md5'
import { publicIpv4 } from 'public-ip'
import * as crypto from 'node:crypto'
import { stringify } from 'node:querystring'
import { env } from 'node:process'
import { apiKey, gid, uid } from "../API_key"

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
*/


export default defineNitroPlugin(async (nitroApp) => {
    //i need to make the 2 fetches synchronously, hence the "await" on the first one
    //the upload request will not immediately return the data collected from the sensors - the content
    //of "result" is either "OK;" or "ERROR;"
    scheduleJob('*/20 * * * * *', async () => {
        var responseValid = await $fetch<string>(await constructURL("uplc"))
        .then(res => {
            return res === "OK;"
        }).catch(err=>{
            console.log(err)
            return false
        })

        if (responseValid) await new Promise((resolve, reject) => {
            const repLimit = 6
            var reps = 0
            const repDelay = 1000*10

            const intervalID = setInterval(async () => {
                $fetch<string>(await constructURL("dnld"))
                .then(res => {
                    const parsedData = parseRawServerData(res)
                    if (parsedData !== null){
                        clearInterval(intervalID)
                        resolve(parsedData)
                    }  //terminates the promise chain, goes to the if clause
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
        .then(res=>console.log(res))
        .catch(err=>console.log(err))

        return
        
    })
})

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
            // query.from = 95079 //hardcoded to always get this one record 
            query.new = 1 //cloud internally keeps track of the last record i pulled
            query.count = 1
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

//TODO you need to consider the situation where the data fetched is not the sensor readings, for instance the GW connected signal.
//you should either retry the request, without incrementing the retry counter, or fetch all new records and then filter them.
function parseRawServerData(rawData: string): {datetime: Date; readings: number[]} | null {
    console.log(rawData)
    if (rawData === "0;;;\r\n") return null //no new data on the server
    
    //split what you get from the server into index, datetime, and data field
    //the below regex does not cate about the number of matching records (the XX;;; part)
    const re1 = /(\d+);(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2});([A-F0-9]+);/g
    const arr = [...rawData.matchAll(re1)][0]
    //if i entered more matching strings, the arr would be longer at the first level (ie. item arr[1] would exist)
    //but since i get a string that has only one matching pattern, i only get one element in the array.

    //arr1[0] is the entire string matched
    //arr1[1] is the record index
    const readings = parseSensorData(arr[3])//arr1[3] gets the data field
    if (readings.length === 0) return null //sensor data is, for some reason, invalid

    const datetime = new Date(arr[2])//arr1[2] gets the datetime field
    console.log(`${readings} @: ${datetime}`)

    return {datetime, readings} //TODO transform it before returning into the same format as the DB reqiures
}


//we need to filter out responses that we dont really caer about, like "GW connected" or "talked to a sensor"
function filterSensorData(rawSensor: string): boolean {
    if (rawSensor.slice(0, 4) === "0000") return false //data sent by GW once it connects to the server
    // else if (rawSensor.length != 32 && rawSensor.length != 38) return false //every crucial-data-containing message
    //a propper sensor-message-data-thing has a sequence of bytes: XXXX.5E.81.(0140|0150)
    const filterRex = /(\d{4})(5E81)(0140|0150)(00)(?:[A-Z0-9]+)/g
    const matches = [...rawSensor.matchAll(filterRex)][0]
    if (matches.length <= 0) return false //if matchAll does not find a match, it returns an empty list

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

function parseSensorData(rawSensor: string): number[] {
    if (!filterSensorData(rawSensor)) return []

    //Look up the sensor's docs - to get temperature from "raw" reading, multiply it by 0.0625 (to get C)
    //for humidity (in %) mult by 0.5, etc.
    const unitArray = [0.0625, 0.5, 1, 1]
    //split the data field into frames: metadata, temp, rh, co2, and optionally battery
    //TODO? Do i even need the named group? Consider another approach
    //TODO this approach will only work if the order of sensor readings does not change.
    const re2 = /[A-F0-9]{16}01([A-F0-9]{4})80([A-F0-9]{2})02([A-F0-9]{4})(?:04(?<bat>[A-F0-9]{4}))?/g
    const arr2 = [...rawSensor.matchAll(re2)][0]
    const sensorReadings = arr2.slice(1,4) //TODO: i dont think you should rely on the position of readings in a list. Name all groups.
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
    var result: number[] = []
    sensorReadings.forEach((el, i, arr) => {
        result[i] = parseInt(el, 16) * unitArray[i]
    })
    return result
}

