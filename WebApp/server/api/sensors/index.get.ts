// import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

/*Returns a list of all sensors (id, room, iqrfid)*/
export default defineEventHandler( async(event) => {
    const queryParams = getQuery(event)

    let sensorID: string | undefined = undefined
    if (typeof queryParams.iqrfid === 'string'){
        sensorID = queryParams.iqrfid
    }
    let roomName: string | undefined = undefined
    if (typeof queryParams.room === 'string'){
        roomName = queryParams.room
    }

    let res
    try {
        res = await prisma.sensor.findMany({
            where:{
                iqrfId: sensorID,
                name: roomName
            }
        })
    } catch (err) {
        setResponseStatus(event, 500) //is there a point to this?
        var prismaErrCode: string = "Unknown Error"
        if (err instanceof Prisma.PrismaClientKnownRequestError) prismaErrCode = err.code
        throw createError({
            statusCode: 500,
            statusMessage: `Prisma encountered an error while saving records to the database: ${prismaErrCode}`,
        })
    }

    setResponseStatus(event, 200)
    return { sensors: res }
})