<template>
    <div class=" w-full h-full">

        <div class="flex flex-row justify-evenly items-center h-1/6 w-full text-white bg-black text-5xl">
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
            <Line :data="chartReactiveData" :options="chartReactiveOptions" :plugins="[backgroundColorPlugin]"/>
        </div>

    </div>
</template>


<script setup lang="ts">
import { Chart, Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

import annotationPlugin from 'chartjs-plugin-annotation';
ChartJS.register(annotationPlugin);

import type { SensorDataType, SingleSensorReadingsType } from "../types/types"
import { DisplayType , ChartHealthStatus} from "../types/enums"

const props = defineProps<{
    sensorReadings?: SingleSensorReadingsType, //making it undefined so that charts will just be empty if no data
    readingToDisplay: DisplayType
}>()

//TODO horisontal chart lines at specific points: https://stackoverflow.com/questions/42691873/draw-horizontal-line-on-chart-in-chart-js-on-v2 

//This works, but the switch in the function doenst !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// chartOptions.value.scales.y = {min: -15, max: 40}

//this one is for splitting sensorReadings - the chart will alternate between temp/rehu/co2c
const chartData = ref<number[]>([0])
const chartTime = ref<string[]>([])
const chartBgColor = ref<string>('#2596be') //blue 

/*The reason for this weird ref existing is that, for some reason, i could dynamically change annotations
but cannot do the same with axis ranges. Wrapping the ref with all options in a computed property and passing that
property to the chart element didnt help either. 
But it seems that if i define the level-0 properties in computed() and then assign to deeper-level objects values
from a ref, then it works. So if i need to dynamically change the color of the lines, for example, then
i would have to create a property within the below ref and then reference it in computed(). Weird. But works.*/
const chartOptions = ref({
    animationDuration: 400,
    annotations: {},
    y: {}
})

onMounted(() => {
    if (props.sensorReadings === undefined){
        //here i need to display something on the chart that will indicate that data either
        //hasnt loaded yet, or that theres no data.
    }
})

const chartReactiveOptions = computed(() => {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: chartOptions.value.animationDuration
        },
        elements:{
            point: {
                backgroundColor: "#000000"
            }
        },
        scale:{ //apply to both scales
            font: {
                size: 16
            }
        },
        scales: {
            y: chartOptions.value.y
        },
        plugins: {
            legend: {
                display: false
            },
            //the annotation plugin is not in-line - i cannot pass it into :plugins array into the chart (???)
            //in contrast, the background color plugin is inline - i can define somewhere and pass it into the above array.
            annotation: {
                annotations: chartOptions.value.annotations,
            }
        }
    }
})

//this one is directly passed to the line chart element
const chartReactiveData = computed(() => {
    return {
        labels: chartTime.value, //if labels are undefined, the chart just wont display data (good)
        datasets: [{
            data: chartData.value,
            tension: 0.4,
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

//This function will be called both when new data is available to display
//and when the type of data to display changes.
//This might not be too efficient, since when just 1 new record gets pushed to the sensorReadings array
//the entire chartData array gets overwritten
//On the flipside, one function does 2 things and its not called all too often
//so performance loss is negligible  
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
    chartTime.value = getHourMinFromDate(allSensorReadings.time)
}

function setChartBgColorBasedOnLastReading(){
    const mostRecentDataPointValue = chartData.value[chartData.value.length - 1]
    let currentReadingQuality: ChartHealthStatus
    try {
        currentReadingQuality = calculateSafetyValue(mostRecentDataPointValue, props.readingToDisplay)
    } catch (err) {
        currentReadingQuality = ChartHealthStatus.Red
        console.log(err)
    }
    chartBgColor.value = currentReadingQuality
}

function getHourMinFromDate(date: string[]): string[]{
    let formattedDates: string[] = []
    date.forEach(el => {
        const dateObj = new Date(el)
        let minutes: number|string = dateObj.getMinutes()
        let hours: number = dateObj.getHours()
        if (minutes < 10) minutes = `0${minutes.toString()}`

        formattedDates.push(`${hours}:${minutes}`)
    })
    return formattedDates
}

//https://www.chartjs.org/chartjs-plugin-annotation/latest/
function drawLinesBasedOnReadingType(type: DisplayType){
    //Find a way to do this on a loop
    switch (type){
        case DisplayType.Temp:
            chartOptions.value.annotations = {
                line1: {
                    type: 'line',
                    yMin: 14,
                    yMax: 14,
                    borderColor: 'rgb(90, 90, 90)',
                    borderWidth: 2,
                    z: 10
                },
                line2: {
                    type: 'line',
                    yMin: 18,
                    yMax: 18,
                    borderColor: 'rgb(90, 90, 90)',
                    borderWidth: 2,
                    z: 10
                },
                line3: {
                    type: 'line',
                    yMin: 22,
                    yMax: 22,
                    borderColor: 'rgb(90, 90, 90)',
                    borderWidth: 2,
                    z: 10
                },
                line4: {
                    type: 'line',
                    yMin: 26,
                    yMax: 26,
                    borderColor: 'rgb(90, 90, 90)',
                    borderWidth: 2,
                    z: 10
                }
            }
            break
        case DisplayType.Rehu:
            chartOptions.value.annotations = {
                line1: {
                    type: 'line',
                    yMin: 20,
                    yMax: 20,
                    borderColor: 'rgb(90, 90, 90)',
                    borderWidth: 2,
                    z: 10
                },
                line2: {
                    type: 'line',
                    yMin: 30,
                    yMax: 30,
                    borderColor: 'rgb(90, 90, 90)',
                    borderWidth: 2,
                    z: 10
                },
                line3: {
                    type: 'line',
                    yMin: 50,
                    yMax: 50,
                    borderColor: 'rgb(90, 90, 90)',
                    borderWidth: 2,
                    z: 10
                },
                line4: {
                    type: 'line',
                    yMin: 60,
                    yMax: 60,
                    borderColor: 'rgb(90, 90, 90)',
                    borderWidth: 2,
                    z: 10
                }
            }
            break
        case DisplayType.CO2c:
            chartOptions.value.annotations = {
                line1: {
                    type: 'line',
                    yMin: 1000,
                    yMax: 1000,
                    borderColor: 'rgb(90, 90, 90)',
                    borderWidth: 2,
                    z: 10
                },
                line2: {
                    type: 'line',
                    yMin: 2000,
                    yMax: 2000,
                    borderColor: 'rgb(90, 90, 90)',
                    borderWidth: 2,
                    z: 10
                },
            }
            break
    }
}

//Does not work and i dont know why
//TODO try the yAxis approach
//https://stackoverflow.com/questions/28990708/how-to-set-max-and-min-value-for-y-axis
//maybe im changing this property after its drawn? print before/afters
function changeChartScaleBasedOnReadingType(type: DisplayType){
    switch (type){
        case DisplayType.Temp:
            chartOptions.value.y = {min: 10, max: 30}
            break
        case DisplayType.Rehu:
            chartOptions.value.y = {min: 0, max: 100}
            break
        case DisplayType.CO2c:
            chartOptions.value.y = {min: 400, max: 5000}
            break
    }
}

//this watcher will be useful once new data is fetched from the server
watch(() => props.sensorReadings, (newReadings, oldReadings) => {
    if (newReadings !== undefined){
        //i want to turn off animations for when new reading come in - i dont want the charts to bounce around
        chartOptions.value.animationDuration = 0
        choseSensorReadingToDisplay(newReadings)
    }
    setChartBgColorBasedOnLastReading()    

}, {deep: true}) //need to watch for nested objects to change, not just the object itself
//without deep: true, this watcher is "shallow"

watch(() => props.readingToDisplay, (newDisplay, oldDisplay) => {
    if (props.sensorReadings !== undefined){
        chartOptions.value.animationDuration = 1000
        choseSensorReadingToDisplay(props.sensorReadings)
    }
    setChartBgColorBasedOnLastReading()
    drawLinesBasedOnReadingType(newDisplay)
    changeChartScaleBasedOnReadingType(newDisplay)
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