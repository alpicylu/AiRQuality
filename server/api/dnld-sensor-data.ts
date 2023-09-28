import { PrismaClient } from '@prisma/client'
import {sensorDataType} from "../../types/types"
const prisma = new PrismaClient()

const url = new URL("https://650b0d28dfd73d1fab097d2a.mockapi.io/test/iqrf/sensor")
url.searchParams.append('limit', '1') //get only the first record

export default defineEventHandler(async () => {
    const sensorData = await $fetch<sensorDataType>(url.toString(), {
        method: 'GET',
        headers: {'content-type':'application/json'},

    }).then(
        async (result) => {
            console.log("Fetch performed successfully")
            console.log("Saving data to DB")
            // return result
            await prisma.sensor.update({ //make this intu upsert 
                where: {
                    name: "C1 234"
                },
                data: {
                    readings: {
                        create: {
                            timestamp: result.time,
                            temp: result.temp,
                            rehu: result.rehu,
                            co2c: result.co2c
                        }
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
})
