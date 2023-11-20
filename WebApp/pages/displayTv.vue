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
import { DisplayType } from "~/types/types"
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

definePageMeta({
    layout: false
})

//get the number of registered sensors from the DB
const numberOfSensors = ref(await useFetch("/api/sensors").then(res => res.data.value?.sensors.length))
console.log("sensor count: ", numberOfSensors.value)

//On first render, TvElement will index an empty list. This will not cause an "index-out-of-range" error, however.
//Instead, "undefined" will be read from the "non-existing" indexes.
const fetchedSensorData = ref<(SingleSensorReadingsType)[]>([])
const readingToDisplay = ref<DisplayType>(DisplayType.Temp)

async function getSensorData(){
    const {data} = await useFetch("/api/sensors")

    if (data.value?.sensors === undefined)
        throw new Error("Error fetching a list of available sensors")

    //get a list of registered sensors from the DB
    let iqrfIdSensorList: string[] = []
    data.value.sensors.forEach(el => {
        iqrfIdSensorList.push(el.iqrfId)
    })

    let sensorReadingsObjectList: SingleSensorReadingsType[] = []
    await Promise.all(
        iqrfIdSensorList.map((iqrfid) => useFetch<SingleSensorReadingsType>(`/api/sensors/${iqrfid}/readings`))
    ).then(res => {
        res.forEach(el => { if (el.data.value !== null) sensorReadingsObjectList.push(el.data.value) })
    }).catch(err => {
        throw new Error(err)
    })

    if (sensorReadingsObjectList.length !== iqrfIdSensorList.length) {
        throw new Error("Number of sensors that provided data is not equal to the amount of registered sensors")
    }
    fetchedSensorData.value = sensorReadingsObjectList

    console.log(fetchedSensorData.value)
   
}
getSensorData()

const displayTypeArr = [DisplayType.Temp, DisplayType.Rehu, DisplayType.CO2c]
const changeReadingToDisplayInterval = setInterval(() => {
    readingToDisplay.value = displayTypeArr[ (displayTypeArr.indexOf(readingToDisplay.value) + 1) % 3 ]
}, 1000*10)

</script>