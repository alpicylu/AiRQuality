import { PrismaClient } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
const prisma = new PrismaClient()

/*Possible errors:
The ID specified cannot be parsed to an Int
    Its undefined
    Its NaN
The ID can be parsed to Int but sensor of that ID does not exist. */
export default defineEventHandler(async (event) => {
    const sensorID: string | undefined = getRouterParam(event, 'id')
    if (sensorID === undefined) throw createError({
        statusCode: 400,
        statusMessage: "Sensor ID route parameter is undefined"
    })

    const sensorIntID: number = parseInt(sensorID, 10)
    if (Number.isNaN(sensorIntID)) throw createError({
        statusCode: 400,
        statusMessage: "Sensor ID route parameter is not numeric"
    })

    try {
        const data = await prisma.sensor.findUnique({
            where: {
                iqrfId: sensorIntID
            },
            select: {
                name: true
            }
        })
        return data
    } catch (err) {
        var prismaErrCode: string = "Unknown Error"
        if (err instanceof PrismaClientKnownRequestError) prismaErrCode = err.code
        throw createError({
            statusCode: 500,
            statusMessage: `Prisma encountered an error while fetching records from the database: ${prismaErrCode}`,
        })
    }
    

})