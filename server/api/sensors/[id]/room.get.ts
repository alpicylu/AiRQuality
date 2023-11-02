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

    const sensorIqrfId = idToIqrf(sensorID)
    // if (Number.isNaN(sensorIntID)) throw createError({
    //     statusCode: 400,
    //     statusMessage: "Sensor ID route parameter is not numeric"
    // })

    try {
        const data = await prisma.sensor.findUnique({
            where: {
                iqrfId: sensorIqrfId
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

function idToIqrf(id: string): string{
    const idNum: number = parseInt(id)
    const idHex = idNum.toString(16).padStart(4, '0')
    const res = idHex.replace(/([A-Fa-f0-9]{2})([A-Fa-f0-9]{2})/g, "$2$1")
    return res
}