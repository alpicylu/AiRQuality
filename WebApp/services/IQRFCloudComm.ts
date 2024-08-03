import { stringify } from 'node:querystring'
import { publicIpv4 } from 'public-ip'
import * as crypto from 'node:crypto'

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


/**Exporting this function into a service makes it MUCH easier to test - you just do a partial mock of the module */
//Dont really know how to get NitroFetchOptions to work as a parameter type, so options is any 
//and ill let $fetch throw any error should the options be incorrect.
export async function IQRFCloudComm(cmd: 'uplc'|'dnld', iqrfId?: string, options?: any){
    return $fetch<string>(await constructURL(cmd, iqrfId), options)
}   