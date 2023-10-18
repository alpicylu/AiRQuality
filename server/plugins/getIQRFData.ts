import { nitroApp } from "nitropack/dist/runtime/app";
import { scheduleJob } from 'node-schedule'
import { Md5 } from 'ts-md5'
import { publicIpv4 } from 'public-ip'
import * as crypto from 'node:crypto'

const ver = 2
const uid = "solarlab"
const gid = "12003fb9" //lowercase
const cmd = "dnlc"
const api_key = ""

//https://cloud.iqrf.org/api/api.php? ver=2 & uid=solarlab & gid=12003FB9 & cmd=dnld & new=1 & count=1 & signature=3eee28912c8a116b36cbc5c75f3bfd3e

export default defineNitroPlugin(async (nitroApp) => {
    var data: string;
    scheduleJob('*/5 * * * * *', async () => {
        data = await $fetch<string>(await constructFetchURL())
        // console.log(await constructFetchURL())
        // console.log(data)
    })
})

async function constructSignature(parameter_part: string): Promise<string> {
    const publicIPv4Address: string = await publicIpv4() //good
    const timestamp: string = Math.round( (Date.now()/1000)/600 ).toString() //Date.now returns ms, we need s
    const signatureString: string = `${parameter_part}|${api_key}|${publicIPv4Address}|${timestamp}` //encode thsis to acsii??
    // return Md5.hashAsciiStr(signatureString)
    return crypto.createHash('md5').update(signatureString).digest('utf-8')
    
}

// BIG TODO: How to secure sensitive data on the server
//How to provide TS type definitions: https://stackoverflow.com/questions/45247991/is-there-a-way-to-add-type-definition-globally-in-typescript-2 
async function constructFetchURL(): Promise<string> {
    const base = "https://cloud.iqrf.org/api/api.php?"
    const optional_params = constructOptionalParams()
    const parameter_part = `ver=${ver}&uid=${uid}&gid=${gid}&cmd=${cmd}&${optional_params}&`
    const signature = await constructSignature(parameter_part)
    console.log(signature)
    return `${base}${parameter_part}signature=${signature}`
}

function constructOptionalParams(): string {
    const isNew = '1'
    const count = '1'
    return `new=${isNew}&count=${count}`
}

//ToDo:
//Assume the hash function is correct - check if composite arguments (api key, timestamp, etc) are correct