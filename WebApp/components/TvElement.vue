<template>
    <div class="border-rose-400 border-2 w-full h-full">

        <div class="flex flex-row justify-between items-center h-1/6 w-full bg-black text-white text-5xl">
            <div>{{ props.sensorReadings?.room }}</div>
            <div>{{ readingToDisplayTypeAbbrev }}</div>
            <div class="grid grid-cols-12 text-base h-full">
                <div class="col-span-1 text-3xl text-vert">NOW</div>
                <div class="col-span-3 text-5xl flex justify-center items-center">{{ currentDisplayValue }}</div>

                <div class="col-span-1 text-3xl text-vert">MIN</div>
                <div class="col-span-3 text-5xl flex justify-center items-center">{{ Math.round(Math.min(...chartData)) }}</div>

                <div class="col-span-1 text-3xl text-vert">MAX</div>
                <div class="col-span-3 text-5xl flex justify-center items-center">{{ Math.round(Math.max(...chartData)) }}</div>
            </div>
            <div>C deg</div>
        </div>
        <div class="h-5/6 w-full">
            <Line :data="chartReactiveData" :options="chartOptions"/>
        </div>

    </div>
</template>


<script setup lang="ts">
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)
import type { SensorDataType, SingleSensorReadingsType } from "../types/types"
import {DisplayType} from "../types/types"

const props = defineProps<{
    sensorReadings?: SingleSensorReadingsType, //making it undefined so that charts will just be empty if no data
    readingToDisplay: DisplayType
}>()

const chartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
})

//this one is for splitting sensorReadings - the chart will alternate between temp/rehu/co2c
const chartData = ref<number[]>([0])

onMounted(() => {
    if (props.sensorReadings === undefined){
        //here i need to display something on the chart that will indicate that data either
        //hasnt loaded yet, or that theres no data.
        console.log("No chart data (at least yet) - null")
    }
})

//this one is directly passed to the line chart element
const chartReactiveData = computed(() => {
    return {
        labels: props.sensorReadings?.time, //if labels are undefined, the chart just wont display data (good)
        datasets: [{
            data: chartData.value
        }]
    }
})

const readingToDisplayTypeAbbrev = computed(() => {
    switch (props.readingToDisplay){
        case DisplayType.Temp:
            return "T"
        case DisplayType.Rehu:
            return "RH"
        case DisplayType.CO2c:
            return "CO2"
    }
})

const currentDisplayValue = computed(() => {
    if (chartData.value.at(-1) !== undefined){
        // return Math.round(chartData.value.at(-1))
        chartData.value
    } else {
        return "?"
    }
})

function choseSensorReadingToDisplay(allSensorReadings: SingleSensorReadingsType) {
    switch (props.readingToDisplay){
        case DisplayType.Temp:
            chartData.value = allSensorReadings.temp
            break
        case DisplayType.Rehu:
            chartData.value = allSensorReadings.rehu
            break
        case DisplayType.CO2c:
            chartData.value = allSensorReadings.co2c
            break
    }
}

//this watcher will be useful once new data is fetched from the server
watch(() => props.sensorReadings, (newReadings, oldReadings) => {
    if (newReadings !== undefined){
        chartData.value = newReadings.temp
    }
})
watch(() => props.readingToDisplay, (newDisplay, oldDisplay) => {
    if (props.sensorReadings !== undefined){
        choseSensorReadingToDisplay(props.sensorReadings)
    }
})

</script>



<style>

/* TW does not support vertical text alignment at its core */
.text-vert {
    writing-mode: vertical-lr;
    text-orientation: upright;
    letter-spacing: -0.6rem;
}

</style>