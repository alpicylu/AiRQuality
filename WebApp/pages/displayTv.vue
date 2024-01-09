<template>
    <div class="grid grid-cols-2 h-screen w-screen">
        <div v-for="i in numberOfSensors">
            <TvElement :sensorReadings="fetchedSensorData[i-1]" :readingToDisplay="readingToDisplay"/> <!--v-for starts with 1-->
        </div>
    </div>

</template>

<script setup lang="ts">
import type { SensorDataType, SingleSensorReadingsType } from '~/types/types';
import { DisplayType } from "~/types/enums"

definePageMeta({
    layout: false
})

onMounted(() => {
    getFirstBatchSensorData()
    window.addEventListener("keydown", ExitOnEscPress)
})

onUnmounted(() => {
    clearInterval(changeReadingToDisplayInterval)
    window.removeEventListener("keydown", ExitOnEscPress)
})

//get the number of registered sensors from the DB
const numberOfSensors = ref(await useFetch("/api/sensors").then(res => res.data.value?.sensors.length))
console.log("sensor count: ", numberOfSensors.value)

//On first render, TvElement will index an empty list. This will not cause an "index-out-of-range" error, however.
//Instead, "undefined" will be read from the "non-existing" indexes.
const fetchedSensorData = ref<SingleSensorReadingsType[]>([])
const readingToDisplay = ref<DisplayType>(DisplayType.Temp)
const nDataPointsOnChart = ref<number>(15) 
const iqrfIdSensorList = ref<string[]>([])

const cursorToSensorMap = ref(new Map())


//Make this a composable (shared logic with index.vue)
async function getFirstBatchSensorData(){
    const {data} = await useFetch("/api/sensors")

    if (data.value?.sensors === undefined)
        throw new Error("Error fetching a list of available sensors. Possibly, the fetch failed to get any data (fetched null)")

    //get a list of registered sensors from the DB
    // let iqrfIdSensorList: string[] = []
    data.value.sensors.forEach(el => {
        iqrfIdSensorList.value.push(el.iqrfId)
    })

    let sensorReadingsObjectList: SingleSensorReadingsType[] = []
    await Promise.all(
        iqrfIdSensorList.value.map((iqrfid) => useFetch<SingleSensorReadingsType>(`/api/sensors/${iqrfid}/readings?take=${nDataPointsOnChart.value}&order=desc`))
    ).then(res => {
        res.forEach(el => { //each promise resolved with a value - iterate over those resolves
            const sensorData = el.data.value
            if (sensorData == null) return //if a sensor's data is null, skip to the next iteration
            sensorReadingsObjectList.push(sensorData)
            cursorToSensorMap.value.set(sensorData.iqrfId, sensorData.id.at(0))
        })
    }).catch(console.error)

    if (sensorReadingsObjectList.length !== iqrfIdSensorList.value.length) {
        throw new Error("Number of sensors that provided data is not equal to the amount of registered sensors")
    }

    sensorReadingsObjectList.forEach(sensor => {
        sensor.id.reverse()
        sensor.time.reverse()
        sensor.temp.reverse()
        sensor.rehu.reverse()
        sensor.co2c.reverse()
    })

    fetchedSensorData.value = sensorReadingsObjectList

    console.log(fetchedSensorData.value)
}

//subsequent fetches will ideally only get only a single, freshest record from the DB.
async function getSmallReadingBatch(){
    //first, get the cursor - ID of the most recent fetched reading.
    //you need to get the last ID for every element in fetchedSensorData

    // for (let sensor of fetchedSensorData.value){
    //     pushFakeSensorReadings(sensor)
    // }

    let newReadings: (SingleSensorReadingsType|null)[] = []
    await Promise.all(
        iqrfIdSensorList.value.map((iqrf) => {
            const sensorCurrentCursor = cursorToSensorMap.value.get(iqrf)
            // console.log("map:", cursorToSensorMap)
            // console.log("iqrf key and cursor", iqrf, sensorCurrentCursor)
            return useFetch(`/api/sensors/${iqrf}/readings?take=${nDataPointsOnChart.value}&order=asc&cursor=${sensorCurrentCursor}`)
        })
    ).then(res => {
        res.forEach(el => {
            //we will push null from sensors that for some reasons didnt fetch
            //to keep the sensors from newReadings and fetchedSensorData in the same order (and the arrs themselves in length)
            const sensorData = el.data.value
            newReadings.push(sensorData)
            if (sensorData !== null && sensorData.id.length > 0) cursorToSensorMap.value.set(sensorData.iqrfId, sensorData.id.at(0))
        })
    }).catch(console.error)

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

        if (fetchedSensorData.value[i].id.length > nDataPointsOnChart.value){
            const nOldRecordsToRemove = newReadings[i]!.id.length
            fetchedSensorData.value[i].id = fetchedSensorData.value[i].id.slice(nOldRecordsToRemove)
            fetchedSensorData.value[i].time = fetchedSensorData.value[i].time.slice(nOldRecordsToRemove)
            fetchedSensorData.value[i].temp = fetchedSensorData.value[i].temp.slice(nOldRecordsToRemove)
            fetchedSensorData.value[i].rehu = fetchedSensorData.value[i].rehu.slice(nOldRecordsToRemove)
            fetchedSensorData.value[i].co2c = fetchedSensorData.value[i].co2c.slice(nOldRecordsToRemove)
        }
    }
}

//This is just to test adding new readings and popping old ones 
function pushFakeSensorReadings(sensor: SingleSensorReadingsType) {
    const dateNow = new Date().toISOString()
    const temp = 20 + Math.floor(Math.random() * (5 - (-5) + 1)) + (-5) //degC
    const rehu = 40 + Math.floor(Math.random() * (20 - (-20) + 1)) + (-20) //%
    const co2c = 800 + Math.floor(Math.random() * (400 - (-400) + 1)) + (-400) //ppm
    //https://www.freecodecamp.org/news/javascript-random-number-how-to-generate-a-random-number-in-js/#range-inclusive

    //allways add new reading
    sensor.id = sensor.id.concat("1241336257432")
    sensor.time = sensor.time.concat(dateNow)
    sensor.temp = sensor.temp.concat(temp)
    sensor.rehu = sensor.rehu.concat(rehu)
    sensor.co2c = sensor.co2c.concat(co2c)

    //but if more points have been pushed to those lists than the chart can hold, then
    //remove oldest reading
    if (sensor.id.length > nDataPointsOnChart.value){
        sensor.id = sensor.id.slice(1)
        sensor.time = sensor.time.slice(1)
        sensor.temp = sensor.temp.slice(1)
        sensor.rehu = sensor.rehu.slice(1)
        sensor.co2c = sensor.co2c.slice(1)
    }

}

function ExitOnEscPress(event: KeyboardEvent){
    if (event.code === "Escape") {
        const router = useRouter()
        router.back()
    }
}



const displayTypeArr = [DisplayType.Temp, DisplayType.Rehu, DisplayType.CO2c]
const changeReadingToDisplayInterval = setInterval(() => {
    readingToDisplay.value = displayTypeArr[ (displayTypeArr.indexOf(readingToDisplay.value) + 1) % 3 ]
}, 1000*10)

const x = setInterval(() => {
    getSmallReadingBatch()
}, 1000*2)


</script>