<template>
    <div class="grid grid-cols-2 h-screen w-screen">
        <div v-for="i in numberOfSensors">
            <TvElement :chartData="fetchedSensorData[i]"/>
        </div>
    </div>

</template>

<script setup lang="ts">
import type { SensorDataType, SingleSensorReadingsType } from '~/types/types';
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

definePageMeta({
    layout: false
})

const numberOfSensors = ref(4)
const fetchedSensorData = ref<SingleSensorReadingsType[]>([])

async function getSensors(){
    const {data} = await useFetch("/api/sensors")

    if (data.value?.sensors === undefined)
        throw new Error("Error fetching a list of available sensors")

    let iqrfIdSensorList: string[] = []
    data.value.sensors.forEach(el => {
        iqrfIdSensorList.push(el.iqrfId)
    })

    let sensorReadingsObjectList: SingleSensorReadingsType[] = []
    await Promise.all(
        iqrfIdSensorList.map((iqrfid) => useFetch<SingleSensorReadingsType>(`/api/sensors/${iqrfid}/readings`))
    ).then(res => {
        res.forEach(el => {
            if (el.data.value === null)
                throw new Error("The amount of SingleSensorReadings fetched does not match the number of registered sensors. Some values may be null")
            sensorReadingsObjectList.push(el.data.value)
        })
    }).catch(err => {
        throw new Error(err)
    })

    // sensorReadingsObjectList.forEach(el => console.log(el))
    fetchedSensorData.value = sensorReadingsObjectList
   
}
getSensors()

</script>