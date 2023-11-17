import type { SensorDataType } from "../../types/types"
export default defineEventHandler(async () => {
    //this will be a post request in the future, 
    //because i need to inform the server about the room whose data i want ot get
    //from the cloud
    console.log("Fetching: sensor data")
    const sensorData = await $fetch<SensorDataType[]>("https://650b0d28dfd73d1fab097d2a.mockapi.io/test/iqrf/sensor", {
        method: 'GET',
        headers: {'content-type':'application/json'},
    }).then(
        (result) => {
            console.log("Fetch performed successfully")
            return result
        },
        (error) => {
            console.log("External sensor data fetch failed: ", error)
            return [{
                time: '0',
                temp: 0,
                rehu: 0,
                co2c: 0,
                id: '0'
            }]
        }
    )
    return sensorData
})