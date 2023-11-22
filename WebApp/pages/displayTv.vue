<template>
    <div class="grid grid-cols-2 h-screen w-screen">
        <div v-for="i in numberOfSensors">
            <TvElement :sensorReadings="fetchedSensorData[i-1]" :readingToDisplay="readingToDisplay"/> <!--v-for starts with 1-->
            <!-- <div class="bg-orange-500 border-cyan-700 border- w-full h-full"></div> -->
        </div>
    </div>

</template>

<script setup lang="ts">
import type { SensorDataType, SingleSensorReadingsType } from '~/types/types';
import { DisplayType } from "~/types/enums"
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

definePageMeta({
    layout: false
})

onMounted(() => {
    getFirstBatchSensorData()
})

onUnmounted(() => {
    clearInterval(changeReadingToDisplayInterval)
})

//get the number of registered sensors from the DB
const numberOfSensors = ref(await useFetch("/api/sensors").then(res => res.data.value?.sensors.length))
console.log("sensor count: ", numberOfSensors.value)

//On first render, TvElement will index an empty list. This will not cause an "index-out-of-range" error, however.
//Instead, "undefined" will be read from the "non-existing" indexes.
const fetchedSensorData = ref<SingleSensorReadingsType[]>([])
const readingToDisplay = ref<DisplayType>(DisplayType.Temp)
const nDataPointsOnChart = ref<number>(20)
const iqrfIdSensorList = ref<string[]>([])

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
        iqrfIdSensorList.value.map((iqrfid) => useFetch<SingleSensorReadingsType>(`/api/sensors/${iqrfid}/readings?take=${nDataPointsOnChart.value}`))
    ).then(res => {
        res.forEach(el => { if (el.data.value !== null) sensorReadingsObjectList.push(el.data.value) })
    }).catch(err => {
        throw new Error(err)
    })

    if (sensorReadingsObjectList.length !== iqrfIdSensorList.value.length) {
        throw new Error("Number of sensors that provided data is not equal to the amount of registered sensors")
    }
    fetchedSensorData.value = sensorReadingsObjectList

    console.log(fetchedSensorData.value)
}

//subsequent fetches will ideally only get only a single, freshest record from the DB.
function getSmallReadingBatch(){
    //first, get the cursor - ID of the most recent fetched reading.
    //you need to get the last ID for every element in fetchedSensorData

    pushFakeSensorReadings(fetchedSensorData.value[0])

    //Note that i AM using 4 consecutive await-fetches instead of concurrent ones (provided by Promise.all)
    //This is because otherwise i would have to resort to a for-loop within a forloop to match
    //new fetched records with appropriate SingleSensorReadingsType objects 
    //however, this is an async function and its called once every 15-minutes or so
    // for (let sensor of fetchedSensorData.value){
    //     const {data} = await useFetch(
    //         `/api/sensors/${sensor.iqrfId}/readings?take=${nDataPointsOnChart.value}&cursor=${sensor.id[1]}`
    //     ).catch(err => {
    //         throw new Error(err)
    //     })

    //     if (data.value === null) {
    //         console.log("No new batches this time")
    //         return
    //     }

    //     //remove the oldest N records. Unfortunately, id, time and readings have their own arrays
    //     //shift() takes no argument and does only one elem at a time.
    //     //also add the new ones while youre at it
    //     //doesnt matter if id, temp, or whatever. I need the number of records
    //     const nOldRecordsToRemove = data.value?.id.length 
    //     sensor.id   = sensor.id.slice(nOldRecordsToRemove).concat(data.value.id)
    //     sensor.time = sensor.time.slice(nOldRecordsToRemove).concat(data.value.time)
    //     sensor.temp = sensor.temp.slice(nOldRecordsToRemove).concat(data.value.temp)
    //     sensor.rehu = sensor.rehu.slice(nOldRecordsToRemove).concat(data.value.rehu)
    //     sensor.co2c = sensor.co2c.slice(nOldRecordsToRemove).concat(data.value.co2c)

    //     // console.log("current data")
    //     // console.log(sensor.id)
    //     // console.log("new data for", sensor.iqrfId, "N new records: ", nOldRecordsToRemove)
    //     // console.log(data.value.id)
    // }
}

//This is just to test adding new readings and popping old ones 
function pushFakeSensorReadings(sensor: SingleSensorReadingsType) {
    const dateNow = new Date().toISOString()
    const tempBase = 20 //degC
    const rehuBase = 40 //%
    const co2cBase = 800 //ppm
    //https://www.freecodecamp.org/news/javascript-random-number-how-to-generate-a-random-number-in-js/#range-inclusive

    sensor.id.push("FAKEID")
    sensor.id.shift()

    sensor.time.push(dateNow) 
    sensor.time.shift()

    // sensor.temp.push( tempBase + Math.floor(Math.random() * (5 - (-5) + 1)) + (-5) )
    sensor.temp.push(69) //HERE ERROR WHY
    sensor.temp.shift()

    // sensor.rehu.push(rehuBase + Math.floor(Math.random() * (20 - (-20) + 1)) + (-20))
    // sensor.rehu.shift()

    // sensor.co2c.push(co2cBase + Math.floor(Math.random() * (400 - (-400) + 1)) + (-400))
    // sensor.co2c.shift()

    console.log("Sensor: ", sensor)
}

const displayTypeArr = [DisplayType.Temp, DisplayType.Rehu, DisplayType.CO2c]
const changeReadingToDisplayInterval = setInterval(() => {
    readingToDisplay.value = displayTypeArr[ (displayTypeArr.indexOf(readingToDisplay.value) + 1) % 3 ]
}, 1000*15)

const x = setInterval(() => {
    getSmallReadingBatch()
}, 1000*5)


</script>