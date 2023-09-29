import { Prisma, PrismaClient } from '@prisma/client'
import {sensorDataType} from "../../types/types"
import { constrainedMemory } from 'process'
const prisma = new PrismaClient()

const url = new URL("https://650b0d28dfd73d1fab097d2a.mockapi.io/test/iqrf/sensor")
url.searchParams.append('page', '1')
url.searchParams.append('limit', '1') //get only the first record


/* TODO
$ fetch performs the same fetch twice (once on the server, once in the browser). Consider
using a different method, like useFetch().
*/
export default defineEventHandler(async () => {
    try {
        const sensorData = await $fetch<sensorDataType[]>(url.toString(), {
            method: 'GET',
            headers: {'content-type':'application/json'},
    
        })

        //make sensorDAtaType a class


        const readingCreated: Prisma.ReadingCreateInput = {
            timestamp: sensorData.at(0)?.time,
            temp: 1,
            rehu: sensorData.rehu,
            co2c: sensorData.co2c,
            sensor: {
                connect: {
                    name: "C1 234"
                }
            }

        }

        // console.log(readingCreated)
        

    //     await prisma.sensor.upsert({ //make this intu upsert 
    //         where: { name: "C1 234" },
    //         create: {
    //             name: "C1 234",
    //             readings: {
    //                 create: { //can i reference TS values in Prisma queries?
    //                     timestamp: "2023-09-01T02:02:02.568Z",
    //                     temp: 123,
    //                     rehu: 123,
    //                     co2c: 123
    //                 }
    //             }
    //         },
    //         update: {readings: {create: readingCreated}}
    //     })

    }
    catch (error) {
        console.log("Saving data to DB failed:")
        console.log(error)
    }
})



/** Archive:
 * .then(
        async (result) => {
            console.log("Fetch performed successfully")
            console.log("Saving data to DB")
            // console.log(result.temp)
           
            const readingCreated: Prisma.ReadingCreateInput = {
                timestamp: result.time,
                temp: result.temp,
                rehu: result.rehu,
                co2c: result.co2c,
                sensor: {
                    connect: {
                        name: "C1 234"
                    }
                }
            }

            await prisma.sensor.upsert({ //make this intu upsert 
                where: {
                    name: "C1 234"
                },
                create: {
                    name: "C1 234",
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
                        create: readingCreated
                    }
                }
            })
        },
        (error) => {
            console.log("External sensor data fetch failed: ", error)
            return {
                time: '0',
                temp: 0,
                rehu: 0,
                co2c: 0,
                id: '0'
            }
        }
    )
 */