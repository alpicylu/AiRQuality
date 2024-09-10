import { PrismaClient, Prisma } from '@prisma/client'
import type { Sensor } from '@prisma/client'
// import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import type { SensorDataType } from '~/types/types'
import { DateTime } from 'luxon'
const prisma = new PrismaClient()

/**TODO:
 * if data passed into body is invalid/not formatted correctly, prisma will throw an unknown error, which was quite annoying to trace.
 * 
 */

export default defineEventHandler( async (event) => {
    const sensorID: string | undefined = getRouterParam(event, 'id')
    if (sensorID === undefined) throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Sensor ID route parameter is undefined"
    })
    const sensorIDRegex = /^\d{4}$/
    if (typeof(sensorID)==='string' && !sensorIDRegex.test(sensorID)){
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: `Invalid query parameter: sensorID: ${sensorID}`
        })
    }

    const body = await readBody(event)
    var invalidBody: boolean = false

    //attempt to format time body field to ISO UTC
    const time = DateTime.fromISO(body.time).toUTC()
    if (!DateTime.isDateTime(time)) invalidBody = true

    const temp = parseFloat(body.temp)
    if (Number.isNaN(temp)) invalidBody = true

    const rehu = parseFloat(body.rehu)
    if (Number.isNaN(rehu)) invalidBody = true

    const co2c = parseFloat(body.co2c)
    if (Number.isNaN(co2c)) invalidBody = true

    if (invalidBody) throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: `Invalid body parameter`
    })

    //testing override - if this field is present, dont add record to DB
    if (body.id === 'TEST'){
        setResponseStatus(event, 201)
        return
    }

    var prismaResponse: Sensor
    try {
        prismaResponse = await prisma.sensor.update({
            where: {iqrfId: sensorID},
            data: {
                readings: {
                    create: {
                        timestamp: time.toString(), //this is a misnomer - we store ISO UTC datetimes.
                        temp: temp,
                        rehu: rehu,
                        co2c: co2c
                    }
                }
            }
        })
        
    } catch (err) {
        console.error(body)
        var prismaErrCode: string = "Unknown Error"
        if (err instanceof Prisma.PrismaClientKnownRequestError) prismaErrCode = err.code
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
            message: `Prisma encountered an error while saving records to the database: ${prismaErrCode}. `,
        })
    }

    setResponseStatus(event, 201)
    return prismaResponse
})