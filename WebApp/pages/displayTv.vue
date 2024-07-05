<template>
    <div class="h-screen w-screen grid grid-cols-2">
        <TvElement v-for="i in numberOfSensors" :sensorReadings="fetchedSensorData[i-1]" :readingToDisplay="readingToDisplay"/> <!--v-for starts with 1-->
    </div>
</template>

<script setup lang="ts">
import type { SensorDataType, SingleSensorReadingsType } from '~/types/types';
import { DisplayType } from "~/types/enums"
import {msClientServerPollDelay} from "~/constants/constants"

definePageMeta({
    layout: false
})

onMounted(() => {
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
// const fetchedSensorData = ref<SingleSensorReadingsType[]>([])
const readingToDisplay = ref<DisplayType>(DisplayType.Temp)
const nDataPointsOnChart = ref<number>(15) 

const {iqrfIdSensorList, fetchedSensorData, getFirstBatchSensorData, pollServerForNewReadings} = useGetSensorData()
getFirstBatchSensorData(nDataPointsOnChart.value).catch(console.error)

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
    // getSmallReadingBatch()
    pollServerForNewReadings(nDataPointsOnChart.value)
}, msClientServerPollDelay)


</script>