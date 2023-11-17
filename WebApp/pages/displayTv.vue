<template>
    <div class="grid grid-cols-2 h-screen w-screen">
        <div v-for="i in numberOfSensors">
            <TvElement :chartData="fetchedSensorData"/>
        </div>
    </div>

</template>

<script setup lang="ts">
import type { SensorDataType } from '~/types/types';
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

definePageMeta({
    layout: false
})

const numberOfSensors = ref(4)
const fetchedSensorData = ref<SensorDataType[]>([])


async function getSensorData(){
    const x = await prisma.sensor.findMany({
        select: {
            name: true,
            readings: true 
        },
        take: 8
    })
    console.log(x)
}
getSensorData()

</script>