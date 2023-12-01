import { PrismaClient } from '@prisma/client'
import type { Sensor } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import type { SingleSensorReadingsType } from '~/types/types'

const prisma = new PrismaClient()

/*
Returns null if a sensor with the matching IQRFID was not found
Return undefined / void if it threw an error and hasnt finished its planned execution(?)
IF an error is thrown by an asynchronous function (a promise), and that error is handled, this function returns undefined.
 */
export default defineEventHandler( async(event) => {
    const sensorID: string | undefined = getRouterParam(event, 'id')
    const queryParams = getQuery(event)

    let recordLimit = 24 //default is 24, if take is faulty or undefined
    if (typeof queryParams.take === 'string'){ 
        recordLimit = parseInt(queryParams.take.toString())
    }

    let readingIdCursor: string|undefined = undefined //id of the last fetched reading
    let skipNRecords: number|undefined = undefined //to omit the last record from the last batch (if skip == 1)
    if (typeof queryParams.cursor === 'string') {
        //check if reading with this id (cursor) exists
        readingIdCursor = queryParams.cursor 
        skipNRecords = 1
        console.log("Passed cursor: ", readingIdCursor)
    }

    //TODO check if this follows a format
    //no need, since if Prisma gets a non-existing sensorID, then it will just return null, which should
    //be checked for in the caller
    if (sensorID === undefined) throw createError({
        statusCode: 400,
        statusMessage: "Sensor ID route parameter is undefined"
    })

    let raw = null
    try {
        raw = await prisma.sensor.findFirst({
            where: {
                iqrfId: sensorID 
            },
            select:{
                name: true,
                iqrfId: true,
                readings: {
                    select: {
                        timestamp: true,
                        temp: true,
                        rehu: true,
                        co2c: true,
                        id: true //although useless for displaying, its crucial for cursor-based pagination (dislplayTv)
                    },
                    orderBy: {timestamp: "asc"}, 
                    take: recordLimit,
                    skip: skipNRecords,
                    cursor: readingIdCursor !== undefined ? { id: readingIdCursor } : undefined
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

    if (raw === null) throw createError({ //TODO should this be an error? why not just return null
        statusCode: 404,
        statusMessage: `Sensor of ID ${sensorID} was not found in the DB`
    })

    /*If the sensor was found, but no (new) readings were found, this API will return an "empty" SingleSensorReadingsType obj
    defined below */

    console.log("readings-get - prisma query returned: ", raw)

    /*Instead of having N readings, each containing a single timedate, temperature, humidity and co2 value, i want to have
    4 lists of those values enclosed in one object. */
    let result: SingleSensorReadingsType = {
        room: '',
        iqrfId: '',
        id: [],
        time: [],
        temp: [],
        rehu: [],
        co2c: []
    }
    
    result.room = raw.name
    result.iqrfId = raw.iqrfId
    raw.readings.forEach((el, i, self) => {
        result.id.push(el.id)
        result.time.push(el.timestamp.toISOString())
        result.temp.push(el.temp)
        result.rehu.push(el.rehu)
        result.co2c.push(el.co2c)
    })

    return result
})