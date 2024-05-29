import type { SingleSensorReadingsType } from "~/types/types"

/**Should i use useFetch or $fetch here?*/
//TODO: use the 'body: {}' syntax during fetches (also requires a rewrite of some APIs, oh boy)
//TODO: Write some tests for this
export default function (){

    /*State:
        iqrfIdSensorList - IDs of all sensors available in the DB
        fetchedSensorData - array containing N most recent readings of sensors. Each element of that array represents
            a certain amount of readings from one sensor
        cursorToSensorMap - map of (sensorID - mostRecentReading). Serves to establish a cursor for future fetches
    */
    const iqrfIdSensorList = ref<string[]>([])
    const fetchedSensorData = ref<SingleSensorReadingsType[]>([])
    //Will this cursorMap behave as expected? its not an externalized state of the composable
    //only those 2 functions have access to it.
    //is this function somehow persisting its own state?
    //yes, its called a closure. The two functions i return keep the state of their lexical env.
    //this environment is NOT shared among different instances of the same closure.
    const cursorToSensorMap = ref(new Map())

    const getFirstBatchSensorData = async (howMany: number, roomName?: string) => {
        fetchedSensorData.value = [] //clearing the array for the first batch
        //also prevents a mess when [room].vue assigns decimated readings to object props of this array.
        const {data} = await useFetch("/api/sensors", {
            query: {room: roomName}
        })

        if (data.value?.sensors === undefined)
            throw new Error("Error fetching a list of available sensors. Possibly, the fetch failed to get any data (may fetched null)")

        //get a list of registered sensors from the DB
        // let iqrfIdSensorList: string[] = []
        data.value.sensors.forEach(el => {
            iqrfIdSensorList.value.push(el.iqrfId)
        })

        await Promise.all(
            iqrfIdSensorList.value.map((iqrfid) => $fetch<SingleSensorReadingsType>(`/api/sensors/${iqrfid}/readings?take=${howMany}&order=desc`))
        ).then(res => {
            res.forEach(el => { //each promise resolved with a value - iterate over those resolves
                const sensorData = el
                if (sensorData == null) {
                    //need to push empty object of the same type, otherwise a mismatch
                    //will occur when updating the array
                    fetchedSensorData.value.push(<SingleSensorReadingsType>{})
                    return
                }  
                fetchedSensorData.value.push(sensorData)
                cursorToSensorMap.value.set(sensorData.iqrfId, sensorData.id.at(0))
            })
        }).catch(console.error)

        if (fetchedSensorData.value.length !== iqrfIdSensorList.value.length) {
            throw new Error("Number of sensors that provided data is not equal to the amount of registered sensors")
        }

        /* Fetching with order=desc returns the most recent readings but in reverse-chrono order. This loop
        returns the data to its chronological order. */
        fetchedSensorData.value.forEach(sensor => {
            sensor.id.reverse()
            sensor.time.reverse()
            sensor.temp.reverse()
            sensor.rehu.reverse()
            sensor.co2c.reverse()
        })
    }

    const pollServerForNewReadings = async (howMany: number) => {
        //here, i shall abuse the fact that The fulfillment value is an array of fulfilled promises, 
        //in the order of the promises passed, regardless of completion order
        //The order of readings fetched here and the initial fetch from getFirstBatch... is coordinated by 2 things:
        //1. the iqrfIdSensorList array, which is populated in getFirstBatch and stays unchanged after that
        //2. Promise.all returns fulfillment values in the same order that the promises inside of it were passed.
        //The order of sensors here and in the fetchedSensorData array is the same.
        //And i know the promises will be created in the same order because in both cases they are created from the iqrfSensorList arr.
        let newReadings: (SingleSensorReadingsType|null)[] = []
        await Promise.all(
            iqrfIdSensorList.value.map((iqrf) => {
                const sensorCurrentCursor = cursorToSensorMap.value.get(iqrf)
                return $fetch(`/api/sensors/${iqrf}/readings?take=${howMany}&order=asc&cursor=${sensorCurrentCursor}`)
            })
        ).then(res => {
            res.forEach(el => {
                //we will push null from sensors that for some reasons didnt fetch
                //to keep the sensors from newReadings and fetchedSensorData in the same order (and the arrs themselves in length)
                const sensorData = el
                newReadings.push(sensorData)
                if (sensorData !== null && sensorData.id.length > 0) cursorToSensorMap.value.set(sensorData.iqrfId, sensorData.id.at(0))
            })
        }).catch(console.error)

        console.log("Cursor map:", cursorToSensorMap.value)
        console.log("Index fetched for new readings:")
        console.log(newReadings)

        //If at least 1 sensor returned any data, the function will continue
        let totalNewReadings = 0
        newReadings.forEach(el => {
            if (el !== null) totalNewReadings += el.id.length
        })
        if (totalNewReadings === 0){
            console.log("No new batches")
            return
        }

        //dont update readings from sensors that fetched null
        //the i index represents individual sensors (SingleSensorReadingsType objects)
        for (let i=0; i<newReadings.length; ++i){
            if (newReadings[i] === null) continue   //dunno why i need to coerce the null here
            fetchedSensorData.value[i].id = fetchedSensorData.value[i].id.concat(newReadings[i]!.id)
            fetchedSensorData.value[i].time = fetchedSensorData.value[i].time.concat(newReadings[i]!.time)
            fetchedSensorData.value[i].temp = fetchedSensorData.value[i].temp.concat(newReadings[i]!.temp)
            fetchedSensorData.value[i].rehu = fetchedSensorData.value[i].rehu.concat(newReadings[i]!.rehu)
            fetchedSensorData.value[i].co2c = fetchedSensorData.value[i].co2c.concat(newReadings[i]!.co2c)

            if (fetchedSensorData.value[i].id.length > howMany){
                const nOldRecordsToRemove = newReadings[i]!.id.length
                fetchedSensorData.value[i].id = fetchedSensorData.value[i].id.slice(nOldRecordsToRemove)
                fetchedSensorData.value[i].time = fetchedSensorData.value[i].time.slice(nOldRecordsToRemove)
                fetchedSensorData.value[i].temp = fetchedSensorData.value[i].temp.slice(nOldRecordsToRemove)
                fetchedSensorData.value[i].rehu = fetchedSensorData.value[i].rehu.slice(nOldRecordsToRemove)
                fetchedSensorData.value[i].co2c = fetchedSensorData.value[i].co2c.slice(nOldRecordsToRemove)
            }
        }
    }

    return {
        iqrfIdSensorList, fetchedSensorData, cursorToSensorMap,
        getFirstBatchSensorData, pollServerForNewReadings
    }
    
}