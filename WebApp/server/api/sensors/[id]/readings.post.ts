import { PrismaClient } from '@prisma/client'
import type { Sensor } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import type { SensorDataType } from '~/types/types'
const prisma = new PrismaClient()

export default defineEventHandler( async (event) => {
    const sensorID: string | undefined = getRouterParam(event, 'id')
    const body: SensorDataType = await readBody(event)
    var prismaResponse: Sensor

    if (sensorID === undefined) throw createError({
        statusCode: 400,
        statusMessage: "Sensor ID route parameter is undefined"
    })

    try {
        prismaResponse = await prisma.sensor.update({
            where: {iqrfId: sensorID},
            data: {
                readings: {
                    create: {
                        timestamp: body.time,
                        temp: body.temp,
                        rehu: body.rehu,
                        co2c: body.co2c
                    }
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

    setResponseStatus(event, 201)
    return prismaResponse
    // return {updated: true}
})