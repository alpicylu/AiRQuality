import { PrismaClient } from '@prisma/client'
import type { Sensor } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import type { SensorDataType } from '~/types/types'
const prisma = new PrismaClient()

/* Gets records of a sensor specified by the route ID param. Query filters can be applied 
TODO: try to apply a cursor*/
export default defineEventHandler( async(event) => {
    const sensorID: string | undefined = getRouterParam(event, 'id')
    const queryParams = getQuery(event)

    let recordLimit = 50
    if (queryParams.take !== null) {
        recordLimit = parseInt(queryParams.take as string)
    }

    if (sensorID === undefined) throw createError({
        statusCode: 400,
        statusMessage: "Sensor ID route parameter is undefined"
    })

    let raw 
    try {
        raw = await prisma.sensor.findFirst({
            where: {
                iqrfId: "0100" //hardcoded, will become a route param
            },
            select:{
                readings: {
                    select: {
                        timestamp: true,
                        temp: true,
                        rehu: true,
                        co2c: true
                    },
                    orderBy: {timestamp: "desc"}, //newest first
                    take: recordLimit
                }
            }
        })
    } catch (err) {
        setResponseStatus(event, 500)
        var prismaErrCode: string = "Unknown Error"
        if (err instanceof PrismaClientKnownRequestError) prismaErrCode = err.code
        throw createError({
            statusCode: 500,
            statusMessage: `Prisma encountered an error while saving records to the database: ${prismaErrCode}`,
        })
    }

    /*Instead of having N readings, each containing a single timedate, temperature, humidity and co2 value, i want to have
    4 lists of those values enclosed in one object. */
    let result: {time: Date[], temp: number[], rehu: number[], co2c: number[]} = {
        time: [],
        temp: [],
        rehu: [],
        co2c: []
    }
    raw?.readings.forEach((el, i, self) => {
        result.time.push(el.timestamp)
        result.temp.push(el.temp)
        result.rehu.push(el.rehu)
        result.co2c.push(el.co2c)
    })

    return result
})