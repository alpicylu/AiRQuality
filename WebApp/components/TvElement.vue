<template>
    <div class=" w-full h-full">

        <div class="flex flex-row justify-evenly items-center h-1/6 w-full border-white border-x-2 text-white bg-black text-5xl">
            <div>{{ props.sensorReadings?.room }}</div>
            <div>{{ readingToDisplayTypeAbbrev.abbrev }}</div>
            <div class="grid grid-cols-12 text-base h-full">
                <div class="col-span-1 text-3xl text-vert">NOW</div>
                <div class="col-span-3 text-5xl flex justify-center items-center">{{ currentDisplayValue }}</div>

                <div class="col-span-1 text-3xl text-vert">MIN</div>
                <div class="col-span-3 text-5xl flex justify-center items-center">{{ Math.round(Math.min(...chartData)) }}</div>

                <div class="col-span-1 text-3xl text-vert">MAX</div>
                <div class="col-span-3 text-5xl flex justify-center items-center">{{ Math.round(Math.max(...chartData)) }}</div>
            </div>
            <div>{{ readingToDisplayTypeAbbrev.unit }}</div>
        </div>
        <div class="border-black border-x-2 h-5/6 w-full">
            <Line :data="chartReactiveData" :options="chartOptions" :plugins="[backgroundColorPlugin]"/>
        </div>

    </div>
</template>


<script setup lang="ts">
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)
import type { SensorDataType, SingleSensorReadingsType } from "../types/types"
import { DisplayType , ChartHealthStatus} from "../types/enums"

const props = defineProps<{
    sensorReadings?: SingleSensorReadingsType, //making it undefined so that charts will just be empty if no data
    readingToDisplay: DisplayType
}>()

//TODO horisontal chart lines at specific points: https://stackoverflow.com/questions/42691873/draw-horizontal-line-on-chart-in-chart-js-on-v2 
const chartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
    options: {
        scales: {
            y: {
                ticks: {
                    color: '#000000'
                }
            }
        }
    },
    plugins: {
        legend: {
            display: false
        }
    }
})

//this one is for splitting sensorReadings - the chart will alternate between temp/rehu/co2c
const chartData = ref<number[]>([0])
const chartBgColor = ref<string>('#2596be') //blue 

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
            data: chartData.value,
            borderColor: '#000000',
            color: '#000000',
            fontColor: '#000000'
        }]
    }
})

const backgroundColorPlugin = computed(() => {
    return {
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart: any, args: any, options: any) => {
            const {ctx} = chart;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = options.color || chartBgColor.value;
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    }
});

//https://www.chartjs.org/chartjs-plugin-annotation/latest/
const horizontalLineAtSpecificPoint = computed(() => {
    return {
        annotation: {
            annotations: {
                type: 'line',
                borderColor: 'black',
                borderWidth: 5,
                scaleID: 'y',
                value: 20
            }
        }
    }
})

const readingToDisplayTypeAbbrev = computed(() => {
    switch (props.readingToDisplay){
        case DisplayType.Temp:
            return {abbrev: "T", unit: '\u2103'}
        case DisplayType.Rehu:
            return {abbrev: "RH", unit: "%"}
        case DisplayType.CO2c:
            return {abbrev: "CO2", unit: "ppm"}
    }
})



const currentDisplayValue = computed(() => {
    if (chartData.value.at(-1) !== undefined){
        return Math.round(chartData.value[ chartData.value.length - 1 ])
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

    const mostRecentDataPointValue = chartData.value[chartData.value.length - 1]
    let currentReadingQuality: ChartHealthStatus
    try {
        currentReadingQuality = calculateSafetyValue(mostRecentDataPointValue, props.readingToDisplay)
    } catch (err) {
        currentReadingQuality = ChartHealthStatus.Red
        console.log(err)
    }
    chartBgColor.value = currentReadingQuality
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