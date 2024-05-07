<template>

    <div class="text-2xl">{{ now }}</div>
    <div class="text-2xl">{{ max }}</div>
    <div class="text-2xl">{{ min }}</div>
    <div class="text-2xl">{{ avg }}</div>
    <div class="text-2xl">{{ readingToDisplayTypeAbbrev.unit }}</div>

</template>

<script setup lang="ts">
/*This component is currently unused */

import { DisplayType } from '~/types/enums';

//What is this for?
// onMounted

const props = defineProps<{
    sensorReadings?: number[]
    readingType: DisplayType
}>()

const now = ref<number>(0)
const min = ref<number>(0)
const max = ref<number>(0)
const avg = ref<number>(0)

const readingToDisplayTypeAbbrev = computed(() => {
    switch (props.readingType){
        case DisplayType.Temp:
            return {abbrev: "T", unit: '\u2103'}
        case DisplayType.Rehu:
            return {abbrev: "RH", unit: "%"}
        case DisplayType.CO2c:
            return {abbrev: "CO2", unit: "ppm"}
    }
})

function calc(){
    if (props.sensorReadings !== undefined){
        now.value = roundToOneTenth( props.sensorReadings[props.sensorReadings.length - 1] )
        min.value = roundToOneTenth(Math.min(...props.sensorReadings))
        max.value = roundToOneTenth(Math.max(...props.sensorReadings))
        avg.value = roundToOneTenth( props.sensorReadings.reduce((acc, val) => acc+val, 0) / props.sensorReadings.length )
    }
}

function roundToOneTenth(val: number){
    return Math.round(val * 10)/10
}



watch(() => props.sensorReadings, (newVal, oldVal) => {
    calc()
})

</script>

<style>

/* div:nth-of-type(2) {
    background-color: rgb(127 29 29)
} */

</style>