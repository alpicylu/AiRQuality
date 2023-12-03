import { PrismaClient } from '@prisma/client'
import type { Sensor } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import type { SingleSensorReadingsType } from '~/types/types'

const prisma = new PrismaClient()

/*
Returns null if a sensor with the matching IQRFID was not found
Return undefined / void if it threw an error and hasnt finished its planned execution(?)
IF an error is thrown by an asynchronous function (a promise), and that error is handled, this function returns undefined.

Note that orderBy: desc return the latest readings first, but in an order reversed compared to what i need (freshest readings
appear on the left side of the chart, whereas oldest to the right - which makes sense since thats how desc works). This is why
i need to reverse it.
 */
export default defineEventHandler( async(event) => {
    const sensorID: string | undefined = getRouterParam(event, 'id')
    const queryParams = getQuery(event)

    let recordLimit: number|undefined = undefined 
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

    let dateFilter = undefined
    if (typeof queryParams.dateA === 'string' && typeof queryParams.dateB === 'string'){

        if (isNaN(Date.parse(queryParams.dateA)) || isNaN(Date.parse(queryParams.dateB)))
            throw new Error("Invalid date format")

        dateFilter = {
            timestamp: {
                gte: new Date(queryParams.dateA),
                lte: new Date(queryParams.dateB)
            }
        }
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
                    where: dateFilter,
                    orderBy: {timestamp: "desc"}, //take the latest readings first
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
    // raw.readings.forEach((el, i, self) => {
    //     result.id.push(el.id)
    //     result.time.push(el.timestamp.toISOString())
    //     result.temp.push(el.temp)
    //     result.rehu.push(el.rehu)
    //     result.co2c.push(el.co2c)
    // })

    //this is so that records are returned in a chronological order (IF orderBy is set to desc)
    for (let readingIndex = raw.readings.length-1; readingIndex >= 0; --readingIndex){
        result.id.push(raw.readings[readingIndex].id)
        result.time.push(raw.readings[readingIndex].timestamp.toISOString())
        result.temp.push(raw.readings[readingIndex].temp)
        result.rehu.push(raw.readings[readingIndex].rehu)
        result.co2c.push(raw.readings[readingIndex].co2c)
    }

    return result
})