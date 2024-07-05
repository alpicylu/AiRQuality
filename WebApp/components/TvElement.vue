<template>
    <div class="w-full h-full bg-black">

        <div id="belt" class="flex justify-evenly items-center h-1/6 w-full text-white bg-black">
            <div class="leading-none w-min">{{ props.sensorReadings?.room }}</div> 
            <div>{{ readingToDisplayTypeAbbrev.abbrev }}</div>
            <div class="flex flex-col">
                <div class="flex-1 grow-[1] reading-type">NOW</div>
                <div class="flex-1 grow-[2]">{{ currentDisplayValue }}</div>
            </div>
            <div class="flex flex-col">
                <div class="flex-1 grow-[1] reading-type">MIN</div>
                <div class="flex-1 grow-[2]">{{ Math.round(Math.min(...chartData)) }}</div>
            </div>
            <div class="flex flex-col">
                <div class="flex-1 grow-[1] reading-type">MAX</div>
                <div class="flex-1 grow-[2]">{{ Math.round(Math.max(...chartData)) }}</div>
            </div>
            <div>{{ readingToDisplayTypeAbbrev.unit }}</div>
        </div>

        <div class="border-x-2 border-black h-5/6 w-full relative">
            <Line class="absolute top-0 left-0 right-0 bottom-0" :data="chartReactiveData" :options="chartReactiveOptions" :plugins="[backgroundColorPlugin]"/>
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
import { format } from 'path';

const props = defineProps<{
    sensorReadings?: SingleSensorReadingsType, //making it undefined so that charts will just be empty if no data
    readingToDisplay: DisplayType
}>()

//this one is for splitting sensorReadings - the chart will alternate between temp/rehu/co2c
const chartData = ref<number[]>([0])
const chartTime = ref<string[]>([])

const {bgColor, updateBgColor} = useDynamicChartBgColor()

/*The reason for this weird ref existing is that, for some reason, i could dynamically change annotations
but cannot do the same with axis ranges. Wrapping the ref with all options in a computed property and passing that
property to the chart element didnt help either. 
But it seems that if i define the level-0 properties in computed() and then assign to deeper-level objects values
from a ref, then it works. So if i need to dynamically change the color of the lines, for example, then
i would have to create a property within the below ref and then reference it in computed().*/
const chartOptions = ref({
    animationDuration: 400,
    annotations: {},
    y: {}
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
        scale:{ //apply to both scales. https://stackoverflow.com/questions/1248081/how-to-get-the-browser-viewport-dimensions
            font: {
                size: () => Math.min(window.innerHeight * 0.03, 16)
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
            ctx.fillStyle = options.color || bgColor.value;
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
//and when the type of data to display changes, the latter occurring every 10sec.
//it swaps the contents of the array that the chart uses to display data points.
//This might not be too efficient, since when just 1 new record gets pushed to the sensorReadings array
//the entire chartData array gets overwritten
//On the flipside, one function does 2 things and its not called all too often
//so performance loss is negligible (i hope)
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
    chartTime.value = formatDates(allSensorReadings.time, 'hh:mm')
}

//https://www.chartjs.org/chartjs-plugin-annotation/latest/

function drawLinesBasedOnReadingType(type: DisplayType){

    const generateLineObjectsBasedOnLineHeights = (heights: number[]) => {
        var res: {[key: string] : any} = {}
        heights.forEach( (el, i) => {
            res[`line${i}`] = {
                type: 'line',
                yMin: el,
                yMax: el,
                borderColor: 'rgb(90, 90, 90)',
                borderWidth: 2,
                z: 10
            }
        })
        return res
    }

    var lineHeights: number[]
    switch (type){
        case DisplayType.Temp: //14, 18, 22, 26
            lineHeights = [14, 18, 22, 26]
            chartOptions.value.annotations = generateLineObjectsBasedOnLineHeights(lineHeights)
            break
        case DisplayType.Rehu: //20, 30, 50, 60
            lineHeights = [20, 30, 50, 60]
            chartOptions.value.annotations = generateLineObjectsBasedOnLineHeights(lineHeights)
            break
        case DisplayType.CO2c: //1000, 2000
            lineHeights = [1000, 2000]
            chartOptions.value.annotations = generateLineObjectsBasedOnLineHeights(lineHeights)
            break
    }
}


//https://stackoverflow.com/questions/28990708/how-to-set-max-and-min-value-for-y-axis
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
    // setChartBgColorBasedOnLastReading()   
    updateBgColor(chartData.value.at(-1), props.readingToDisplay) 

}, {deep: true}) //need to watch for nested objects to change, not just the object itself
//without deep: true, this watcher is "shallow"

watch(() => props.readingToDisplay, (newDisplay, oldDisplay) => {
    if (props.sensorReadings !== undefined){
        chartOptions.value.animationDuration = 1000
        choseSensorReadingToDisplay(props.sensorReadings)
    }
    // setChartBgColorBasedOnLastReading()
    try {
        updateBgColor(chartData.value.at(-1), props.readingToDisplay) 
    } catch (err) {
        console.log(err)
    }
    
    drawLinesBasedOnReadingType(newDisplay)
    changeChartScaleBasedOnReadingType(newDisplay)
})

</script>



<style>

/* TW does not support vertical text alignment at its core */
/* .text-vert {
    writing-mode: vertical-lr;
    text-orientation: upright;
    text-align: center;
    vertical-align: middle;
    width: min-content;

    font-size: min(3vh, 3vw);
    line-height: 1;
    letter-spacing: -0.5rem;
} */

.reading-type{
    font-size: min(2vh, 2vw)
}

#belt {
    font-size: min(4vh, 3vw);
    /* line-height: 1vh; */
}



</style>