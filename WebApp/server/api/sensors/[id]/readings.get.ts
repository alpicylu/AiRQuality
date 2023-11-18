import { PrismaClient } from '@prisma/client'
import type { Sensor } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import type { SingleSensorReadingsType } from '~/types/types'

const prisma = new PrismaClient()

/* Gets records of a sensor specified by the route ID param. Query filters can be applied 
TODO: try to apply a cursor*/
export default defineEventHandler( async(event) => {
    const sensorID: string | undefined = getRouterParam(event, 'id')
    const queryParams = getQuery(event)

    let recordLimit = 50
    if (queryParams.take !== undefined && queryParams.take !== null){
        recordLimit = parseInt(queryParams.take?.toString())
    }

    //TODO check if this follows a format
    if (sensorID === undefined) throw createError({
        statusCode: 400,
        statusMessage: "Sensor ID route parameter is undefined"
    })

    let raw = null
    try {
        raw = await prisma.sensor.findFirst({
            where: {
                iqrfId: sensorID //hardcoded, will become a route param
            },
            select:{
                name: true,
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
        // setResponseStatus(event, 500) do i need this too?
        var prismaErrCode: string = "Unknown Error"
        if (err instanceof PrismaClientKnownRequestError) prismaErrCode = err.code
        throw createError({
            statusCode: 500,
            statusMessage: `Prisma encountered an error while fetching records from the database: ${prismaErrCode}`,
        })
    }

    if (raw === null) throw createError({
        statusCode: 404,
        statusMessage: `The readings of a sensor with iqrfID ${sensorID} were not found`
    })

    /*Instead of having N readings, each containing a single timedate, temperature, humidity and co2 value, i want to have
    4 lists of those values enclosed in one object. */
    let result: SingleSensorReadingsType = {
        room: '',
        time: [],
        temp: [],
        rehu: [],
        co2c: []
    }
    
    result.room = raw.name
    raw?.readings.forEach((el, i, self) => {
        result.time.push(el.timestamp.toISOString())
        result.temp.push(el.temp)
        result.rehu.push(el.rehu)
        result.co2c.push(el.co2c)
    })

    return result
})