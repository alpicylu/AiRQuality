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

    //checking for user error in query parameters 
    const sensorIDRegex = /^\d{4}$/
    if(typeof(sensorID)==='string' && !sensorIDRegex.test(sensorID)){
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: `Invalid query parameter: sensorID ${sensorID}`
        })
    }

    const roomNameRegex = /^[A-Z]\d+\s\d+$/
    if(typeof(roomName)==='string' && !roomNameRegex.test(roomName)){
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request",
            message: `Invalid query parameter: roomName ${roomName}`
        })
    }

    //attempting to fetch the requested resource
    let res = []
    try {
        res = await prisma.sensor.findMany({
            where:{
                iqrfId: sensorID,
                name: roomName
            }
        })
    } catch (err) {
        var prismaErrCode: string = "Unknown Error"
        if (err instanceof Prisma.PrismaClientKnownRequestError) prismaErrCode = err.code
        throw createError({
            statusCode: 500,
            message: `Prisma encountered an error while saving records to the database: ${prismaErrCode}`,
            statusMessage: 'Internal Server Error'
        })
    }
    
    //no resource has been found
    if(res.length <= 0){
        throw createError({
            statusCode: 404,
            statusMessage: "Not Found"
        })
    }

    //all good
    setResponseStatus(event, 200)
    
    return { sensors: res }
})




// // import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
// import { PrismaClient, Prisma } from '@prisma/client'
// const prisma = new PrismaClient()

// /*Returns a list of all sensors (id, room, iqrfid)*/
// export default defineEventHandler( async(event) => {
//     const queryParams = getQuery(event)

//     let sensorID: string | undefined = undefined
//     if (typeof queryParams.iqrfid === 'string'){
//         sensorID = queryParams.iqrfid
//     }
//     let roomName: string | undefined = undefined
//     if (typeof queryParams.room === 'string'){
//         roomName = queryParams.room
//     }

//     let res
//     try {
//         res = await prisma.sensor.findMany({
//             where:{
//                 iqrfId: sensorID,
//                 name: roomName
//             }
//         })
//     } catch (err) {
//         var prismaErrCode: string = "Unknown Error"
//         if (err instanceof Prisma.PrismaClientKnownRequestError) prismaErrCode = err.code
//         throw createError({
//             statusCode: 500,
//             statusMessage: 'Internal Server Error',
//             message: `Prisma encountered an error while saving records to the database: ${prismaErrCode}`,
//         })
//     }

//     setResponseStatus(event, 200)
//     return { sensors: res }
// })