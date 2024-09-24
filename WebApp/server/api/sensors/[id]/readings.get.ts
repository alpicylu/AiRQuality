import { PrismaClient, Prisma } from '@prisma/client'
// import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
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

    //i dont think its ever going to be undefined, because if it was undef then the client would not
    //reach this API endpoint, but whatever
    if (sensorID === undefined) throw createError({
        statusCode: 400,
        statusMessage: "Sensor ID route parameter is undefined"
    })
    const sensorIDRegex = /^\d{4}$/
    if(typeof(sensorID)==='string' && !sensorIDRegex.test(sensorID)){
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: `Invalid query parameter: sensorID: ${sensorID}`
        })
    }

    const queryParams = getQuery(event)

    let take: number|undefined = undefined
    if (typeof(queryParams.take) === 'string'){ 
        take = parseInt(queryParams.take.toString())
    }

    let cursor: string|undefined = undefined //id of the last fetched reading
    let skipNRecords: number|undefined = undefined //to omit the last record from the last batch (if skip == 1)
    if (typeof queryParams.cursor === 'string') {
        //TODO check if reading with this id (cursor) can exist
        // console.log(queryParams.cursor)
        if (!/^[0-9a-fA-F]{24}$/g.test(queryParams.cursor)) {
            throw createError({
                statusCode: 400,
                statusMessage: "Bad Request",
                message: `Invalid reading cursor ID. Must be a hexadecimal string, 24-chars in length`
            })
        }

        cursor = queryParams.cursor 
        skipNRecords = 1
    }

    let dateFilter = undefined
    if (typeof queryParams.dateA === 'string' && typeof queryParams.dateB === 'string'){

        if (isNaN(Date.parse(queryParams.dateA)) || isNaN(Date.parse(queryParams.dateB))) throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: `One of the dates is in an invalid format`
        })

        dateFilter = {
            timestamp: {
                gte: new Date(queryParams.dateA),
                lte: new Date(queryParams.dateB)
            }
        }
    }

    let order: Prisma.SortOrder|undefined = undefined
    if (typeof queryParams.order === 'string'){
        switch (queryParams.order){
            case 'asc':
                order = Prisma.SortOrder.asc
                break
            case 'desc':
                order = Prisma.SortOrder.desc
                break
            default: 
                throw createError({
                    statusCode: 400,
                    statusMessage: "Bad Request",
                    message: `Invalid sort order. Valid ones are 'asc' or 'desc'`
                })
                
        }
    }

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
                        id: true //although useless for displaying, its crucial for cursor-based pagination
                    },
                    where: dateFilter,
                    orderBy: {timestamp: order }, //take the latest readings first
                    take: take,
                    skip: skipNRecords,
                    cursor: cursor !== undefined ? { id: cursor } : undefined
                }
            }
        })
    } catch (err) {
        // setResponseStatus(event, 500) do i need this too?
        var prismaErrCode: string = "Unknown Error"
        if (err instanceof Prisma.PrismaClientKnownRequestError) prismaErrCode = err.code
        throw createError({
            message: `Prisma encountered an error while fetching records from the database: ${prismaErrCode}`,
            statusCode: 500,
            statusMessage: 'Internal Server Error',
        })
        //what response is returned if error is thrown
    }

    if (raw === null) throw createError({ 
        message: `Sensor of ID ${sensorID} was not found in the DB`,
        statusCode: 404,
        statusMessage: "Not Found"
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
    raw.readings.forEach((el, i, self) => {
        result.id.push(el.id)
        result.time.push(el.timestamp.toISOString())
        result.temp.push(el.temp)
        result.rehu.push(el.rehu)
        result.co2c.push(el.co2c)
    })

    setResponseStatus(event, 200)
    
    return result
})