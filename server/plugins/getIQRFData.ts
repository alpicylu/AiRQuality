import { nitroApp } from "nitropack/dist/runtime/app";
import { scheduleJob } from 'node-schedule'
import { Md5 } from 'ts-md5'
import { publicIpv4 } from 'public-ip'
import * as crypto from 'node:crypto'
import { stringify } from 'node:querystring'
import { env } from 'node:process'

const queryObj = {
    ver: 2,
    uid: "solarlab",
    gid: "12003fb9", //lowercase
    cmd: "dnld",
    last: 1,
    count: 1,
}



//This is not secure, i know it, but cloud.iqrf's SSL cert has expired. With the certificate being not valid.
//the only option is to not verify their validity.
env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

export default defineNitroPlugin(async (nitroApp) => {
    var data: string;
    scheduleJob('*/5 * * * * *', async () => {
        $fetch<string>(await constructFetchURL())
        .then((res) => {
            data = res
            parseData(data)
            return 
        })
        .catch((err) => {
            console.log(err)
            return
        })
    })
})

async function constructSignature(parameter_part: string): Promise<string> {
    const api_key = ""
    const publicIPv4Address: string = await publicIpv4() //good
    const timestamp: string = Math.round( (Date.now()/1000)/600 ).toString() //Date.now returns ms, we need s
    const signatureString: string = `${parameter_part}|${api_key}|${publicIPv4Address}|${timestamp}` //encode thsis to acsii??
    // return Md5.hashAsciiStr(signatureString)
    return crypto.createHash('md5').update(signatureString).digest('hex')
    
}

// BIG TODO: How to secure sensitive data on the server
//How to provide TS type definitions: https://stackoverflow.com/questions/45247991/is-there-a-way-to-add-type-definition-globally-in-typescript-2 
async function constructFetchURL(): Promise<string> {
    const base = "https://cloud.iqrf.org/api/api.php?"
    const parameter_part = stringify(queryObj)
    const signature = await constructSignature(parameter_part)
    return `${base}${parameter_part}&signature=${signature}`
}


/* the current regex does not capture the 'names' of readings - it does not capture the '01' in the temp 'frame' etc.
If the order of sensors in fetched data does not change, then this is not an issue, but just to be sure 
make it so the sensors can appear in any order and the readings still be properly captured */
function parseData(rawData: string) {
    const unitArray = [0.0625, 0.5, 1, 1]
    //Look up the sensor's docs - to get temperature from "raw" reading, multiply it by 0.0625 (to get C)
    //for humidity (in %) mult by 0.5, etc.

    //split what you get from the server into index, datetime, and data field
    const re1 = /(\d+);(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2});([A-F0-9]+);/g
    const arr1 = [...rawData.matchAll(re1)][0]
    const rawReading = arr1[3] //3, because i just want the data field
    //if i entered more matching strings, the arr would be longer at the first level (ie. item arr[1] would exist)
    //but since i get a string that has only one matching pattern, i only get one element in the array.
    // console.log(rawReading)

    //split the data field into frames: metadata, temp, rh, co2, and optionally battery
    //TODO? Do i even need the named group? Consider another approach
    const re2 = /[A-F0-9]{16}01([A-F0-9]{4})80([A-F0-9]{2})02([A-F0-9]{4})(?:04(?<bat>[A-F0-9]{4}))?/g
    const arr2 = [...rawReading.matchAll(re2)][0]
    const sensorReadings = arr2.slice(1,4) //TODO: i dont think you should rely on the position of readings in a list. Name all groups.
    if (arr2.groups !== undefined && arr2.groups.bat !== null){
        sensorReadings.push(arr2.groups.bat) //TODO: test if this clause is robust
    }
    console.log(sensorReadings)

    //if a frame is longer than 1 byte, read each frame from the end, byte-by-byte (due to little-endianiness)
    //maybe you dont need to go full-regex here
    sensorReadings.forEach((el, i, arr) => {
        //each sensor reading has either 2 or 4 characters (1 or 2 bytes)
        if (el.length != 4 && el.length != 2) throw new Error("[Parse error]: sensor reading byte length invalid")
        if (el.length == 4){
            arr[i] = el.replace(/([A-F0-9]{2})([A-F0-9]{2})/g, "$2$1") //switch bytes with eachother
        }
    })
    console.log(sensorReadings)

    //AT LONG LAST, translate hex values to dec
    var result: number[] = []
    sensorReadings.forEach((el, i, arr) => {
        result[i] = parseInt(el, 16) * unitArray[i]
    })
    console.log(result)
}