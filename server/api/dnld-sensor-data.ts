import { Prisma, PrismaClient } from '@prisma/client'
import {sensorDataType} from "../../types/types"
import { useAsyncData, useFetch } from 'nuxt/app'
const prisma = new PrismaClient()

const url = new URL("https://650b0d28dfd73d1fab097d2a.mockapi.io/test/iqrf/sensor")
url.searchParams.append('page', '1')
url.searchParams.append('limit', '1') //get only the first record


/* TODO
    $fetch performs the same fetch twice (once on the server, once in the browser). Consider
using a different method, like useAsynchData().

    Add retry (fetch failed, try again maybe 5 times, then throw error.)

    Think how to make the external API calls entirely on the server, as in there would be a timer
on the server that would call the API. Currently the calls are initiated in the frontend (Nitro plugins?).
The API fetches need to work on the server - cannot tie them to views.

    Cronjob?

*/
export default defineEventHandler(async () => {
    try {
        const sensorData = await $fetch<sensorDataType[]>(url.toString(), {
            method: 'GET',
            headers: {'content-type':'application/json'},
        })

        // console.log(sensorData.at(0))
        console.log("sensor api fetch handler")

        //If fetched data contains undefined/null values, throw an error
        if (Object.values(sensorData).some(value => value===undefined )){
            throw new Error("Fetched data containes undefined values")
        }

        await prisma.reading.deleteMany()

        await prisma.sensor.upsert({ //make this intu upsert 
            where: { name: "C1 234" },
            create: {
                name: "C1 234",
                iqrfId: 1,
                readings: {
                    create: { //can i reference TS values in Prisma queries?
                        timestamp: "2023-09-01T02:02:02.568Z",
                        temp: 123,
                        rehu: 123,
                        co2c: 123
                    }
                }
            },
            update: {
                readings: {
                    create: {
                        timestamp: sensorData[0].time,
                        temp: sensorData[0].temp,
                        rehu: sensorData[0].rehu,
                        co2c: sensorData[0].co2c,
                    }
                }
            }
        })

    //Server errors (the ones send by the API, like 404) wont be handled by the promise chain, since this error would throw
    //before the fetch function properly returns - the chain wont even reach the first .then()
    //this is why for API errors i needed to add this catch block
    } catch (error) {
        console.log("Failed saving to DB: ", error)
    }

})

