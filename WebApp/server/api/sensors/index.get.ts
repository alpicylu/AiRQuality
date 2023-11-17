import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/*Returns a list of all sensors (id, room, iqrfid)*/
export default defineEventHandler( async(event) => {

    let res

    try {
        res = await prisma.sensor.findMany()
    } catch (err) {
        setResponseStatus(event, 500)
        var prismaErrCode: string = "Unknown Error"
        if (err instanceof PrismaClientKnownRequestError) prismaErrCode = err.code
        throw createError({
            statusCode: 500,
            statusMessage: `Prisma encountered an error while saving records to the database: ${prismaErrCode}`,
        })
    }
    
    setResponseStatus(event, 200)
    return res
})