<template>

    <tr>
        <td>{{ now }}</td>
        <td>{{ min }}</td>
        <td>{{ max }}</td>
        <td>{{ avg }}</td>
    </tr>

</template>

<script setup lang="ts">
import type {SingleSensorReadingsType} from "~/types/types"


const props = defineProps<{
    sensorReadings?: number[]
}>()

const now = ref<number>(0)
const min = ref<number>(0)
const max = ref<number>(0)
const avg = ref<number>(0)

function calc(){
    if (props.sensorReadings !== undefined){
        now.value = props.sensorReadings[props.sensorReadings.length - 1]
        min.value = Math.min(...props.sensorReadings)
        max.value = Math.max(...props.sensorReadings)
        avg.value = props.sensorReadings.reduce((acc, val) => acc+val, 0) / props.sensorReadings.length
    }
}

watch(() => props.sensorReadings, (newVal, oldVal) => {
    calc()
})

</script>