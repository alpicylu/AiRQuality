<template>

    <div id="large" class="flex-1 flex flex-col gap-4 mb-4 justify-around items-stretch w-full">

        <div class="flex-initial grid grid-cols-9 grid-rows-1">
            <div class="row-start-1 col-start-2 row-span-1 col-span-4 flex justify-center items-center">
                <h1>C2 108</h1>
            </div>
            <div class="row-start-1 col-start-6 row-span-1 col-span-4 flex justify-around items-center basis-1/2 ">
                <h2>Now</h2>
                <h2>Max</h2>
                <h2>Min</h2>
                <h2>Avg</h2>
            </div>
        </div>

        <DetailViewLargeChartStat class="flex-auto min-h-32" :data="chartDataTRCReadings.temp" :times="chartTime" :readingType="DisplayType.Temp" />
        <DetailViewLargeChartStat class="flex-auto min-h-32" :data="chartDataTRCReadings.rehu" :times="chartTime" :readingType="DisplayType.Rehu" />
        <DetailViewLargeChartStat class="flex-auto min-h-32" :data="chartDataTRCReadings.co2c" :times="chartTime" :readingType="DisplayType.CO2c" />

        <div class="flex flex-initial justify-evenly items-center">
            <DatePicker v-model:pickerDate="dateA"/>
            <DatePicker v-model:pickerDate="dateB"/>
            <button @click="getReadingsFromDateToDate" class="rounded-full bg-ext-margins p-3">Apply</button>
            <button @click="getFirstBatchSensorData" class="rounded-full bg-ext-margins p-3">Default</button>
            <button @click="buttonTestFunction" class="bg-ext-margins rounded-full p-3">CSV</button>
        </div>

    </div>

    <!-- Phone layout -->

    <div id="small" class="hidden flex-col w-full h-full px-4 gap-4">

        <h1 class="basis-1/12 flex justify-center items-center mt-4">{{ chartDataTRCReadings.room }} (ID: {{ chartDataTRCReadings.iqrfId }})</h1>

        <div class="basis-10/12 flex flex-col justify-around gap-2">
            <DetailViewSmallChartStat :data="chartDataTRCReadings.temp" :times="chartTime" :readingType="DisplayType.Temp" />
            <DetailViewSmallChartStat :data="chartDataTRCReadings.rehu" :times="chartTime" :readingType="DisplayType.Rehu" />
            <DetailViewSmallChartStat :data="chartDataTRCReadings.co2c" :times="chartTime" :readingType="DisplayType.CO2c" />
        </div>

        <div class="basis-1/12 flex justify-around items-center sticky bottom-0 bg-ext-content py-4">
            <div class="flex justify-around bg-ext-margins rounded-full grow-[3]">
                <button><CalendarOutline class="h-8"/></button>
                <button><CalendarSolid class="h-8"/></button>
                <button><CheckIcon class="h-8"/></button>
            </div>
            <button class="grow-[1]"><ArrowPathIcon class="h-8 mx-auto"/></button>
            <button class="grow-[1]"><ArrowDownTrayIcon class="h-8 mx-auto"/></button>
        </div>
        
    </div>

</template>

<script setup lang="ts">
import { Chart, Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'
import type { SingleSensorReadingsType } from '~/types/types';
import { DisplayType } from '~/types/enums';
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

import {formatDatesToHourMinute, formatDatesToHourDayMonth, formatDatesToDayMonth, formatDatesToDayMonthYear} from "~/utils/formatDateTimeStrings"
import {msClientServerPollDelay} from "~/constants/constants"

import { CalendarDaysIcon as CalendarOutline, CheckIcon, ArrowPathIcon, ArrowDownTrayIcon } from "@heroicons/vue/24/outline"
import { CalendarDaysIcon as CalendarSolid } from "@heroicons/vue/24/solid"

definePageMeta({
    middleware: [
        async function (to, from){
            const sensors = await useFetch(`/api/sensors`)
            .then(res => {
                return res.data.value?.sensors
            })
            .catch(console.error)

            let exists = false
            sensors?.forEach(el => {
                const nameWithFloor = el.name.replace(/\s/g, '_')
                if (nameWithFloor === to.params.room)
                    exists = true
            })

            console.log("in function:", exists)
            if (!exists) return abortNavigation()
        }
    ]
})

onMounted(() => {
    getFirstBatchSensorData()
        .catch(err => console.log(err))
})

onUnmounted(() => {
    if (pollServerInterval !== null) {
        clearInterval(pollServerInterval)
        pollServerInterval = null
    }
})

const chartDataTRCReadings = ref<SingleSensorReadingsType>(<SingleSensorReadingsType>{}) //this is where fetched data is saved
const chartTime = ref<string[]>([])

const sensorIqrfID = ref<string|undefined>('') //route param is room number, but api fetches are done through sensor IQRF ID
const roomNumber = ref<string>('')

const nDataPointsOnChart = ref(24)

const {bgColor: tempChartBgColor, updateBgColor: tempChartBgColorUpdate} = useDynamicChartBgColor()
const {bgColor: rehuChartBgColor, updateBgColor: rehuChartBgColorUpdate} = useDynamicChartBgColor()
const {bgColor: co2cChartBgColor, updateBgColor: co2cChartBgColorUpdate} = useDynamicChartBgColor()

const dateA = ref('')
const dateB = ref('')

/*the first cursor will be assigned with the id of the newest reading fetched from getFirstBatchSensorData
this will be used by the first poll of the pollServerForNewReadings func. This cursor gets overwritten with new IDs
after new data is fetched.*/
const batchCursor = ref<string|undefined>('')

const chartReactiveOptions = computed(()=> {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0
        },
        plugins: {
            legend: {
                display: false
            },
        }
    }
})

//3 different charts, displayed on the same page not as separate vue components.
//need separate computed data fields
const tempChartReactiveData = computed(()=> {
    return {
        labels: chartTime.value, 
        datasets: [{
            data: chartDataTRCReadings.value.temp,
            tension: 0.4,
            borderColor: '#000000',
            color: '#000000',
            fontColor: '#000000',
        }]
    }
})

const rehuChartReactiveData = computed(()=> {
    return {
        labels: chartTime.value, 
        datasets: [{
            data: chartDataTRCReadings.value.rehu,
            tension: 0.4,
            borderColor: '#000000',
            color: '#000000',
            fontColor: '#000000'
        }]
    }
})

const co2cChartReactiveData = computed(()=> {
    return {
        labels: chartTime.value, 
        datasets: [{
            data: chartDataTRCReadings.value.co2c,
            tension: 0.4,
            borderColor: '#000000',
            color: '#000000',
            fontColor: '#000000'
        }]
    }
})

const backgroundColorPluginTempChart = computed(() => {
    return {
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart: any, args: any, options: any) => {
            const {ctx} = chart;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = options.color || tempChartBgColor.value;
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    }
})

const backgroundColorPluginRehuChart = computed(() => {
    return {
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart: any, args: any, options: any) => {
            const {ctx} = chart;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = options.color || rehuChartBgColor.value;
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    }
})

const backgroundColorPluginCo2cChart = computed(() => {
    return {
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart: any, args: any, options: any) => {
            const {ctx} = chart;
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = options.color || co2cChartBgColor.value;
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    }
})

async function buttonTestFunction(){
    await useFetch(`/api/sensors/0100/readings?&dateA=${dateA.value}&dateB=${dateB.value}`)
        .then(res => {
            if (res.data.value !== null) return parseSensorReadingToCSV(res.data.value) 
            throw new Error("Fetch returned null - cannot parse to CSV")
        })
        .then(res => {
            const blob = new Blob([res], { type: 'text/csv' })
            const filenameFromDate = `${new Date().toISOString().slice(0, -5).replace(/:/g, "-")}`
            downloadBlob(blob, filenameFromDate)
        })
        .catch(console.error)
} 

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename || 'download';

    // Click handler that releases the object URL after the element has been clicked
    // This is required for one-off downloads of the blob content
    const clickHandler = () => {
        setTimeout(() => {
        URL.revokeObjectURL(url);
        removeEventListener('click', clickHandler);
        }, 150);
    };

    // Add the click event listener on the anchor element
    a.addEventListener('click', clickHandler, false);
    a.click()
}

async function getFirstBatchSensorData(){
    const route = useRoute()

    const roomNumberFromRoute: string = route.params.room as string
    if (roomNumberFromRoute === undefined) throw new Error(" 'room' route parameter is undefined ")

    roomNumber.value = roomNumberFromRoute.replace('_', ' ')

    const sensor = await useFetch(`/api/sensors?room=${roomNumber.value}`)
        .then(res => res.data.value?.sensors.at(0)?.iqrfId)
    if (sensor === null || sensor === undefined) throw new Error("Failed to fetch specified sensor")
    sensorIqrfID.value = sensor

    //desc - fetches newest records, but they are in reverse-chronological order - need to reverse it later
    const readings = await useFetch<SingleSensorReadingsType>(`/api/sensors/${sensorIqrfID.value}/readings?take=${nDataPointsOnChart.value}&order=desc`)
        .then(res => res.data.value)
        .catch(err => console.log(err))
    if (readings === null || readings === undefined) throw new Error("Failed to fetch sensor readings for the specified sensor")

    if (readings.id.length <= 0) {
        console.log("No readings attached to the specified sensor were found")
        return
    }

    //save first ID of reverse-chrono order as cursor for the first of the periodic polls. This cursor corresponds to the newest reading
    batchCursor.value = readings.id.at(0)
    console.log("First cursor:", batchCursor.value)

    /*fetched newest records, but in reverse chrono order - need to reverse the matrix. reverse() mutates the array. */
    readings.id.reverse()
    readings.time.reverse()
    readings.temp.reverse()
    readings.rehu.reverse()
    readings.co2c.reverse()
    
    chartDataTRCReadings.value = readings
    chartTime.value = formatDatesToHourMinute(chartDataTRCReadings.value.time)

    if (pollServerInterval === null) pollServerInterval = setInterval(() => {pollServerForNewReadings()}, msClientServerPollDelay)    
}

async function pollServerForNewReadings(){
    //with ascending order, last cursor should be at index 0? since we are flipping the arrays in readings.get?
    const readings = await useFetch<SingleSensorReadingsType>( //note that .at(-1) can produce undefined, which will be passed as 'undefined' (string) here
        `/api/sensors/${sensorIqrfID.value}/readings?take=${nDataPointsOnChart.value}&order=asc&cursor=${batchCursor.value}`
    )
    .then(res => {
        return res.data.value
    })
    .catch(err => {
        console.log(err)
    })

    if (readings === undefined) throw new Error("Sensor readings fetch encountered an error and has not retrieved data from DB")
    //there isnt really a case in my API route to return null, but ig useFetch can possibly return it if something goes bad?
    else if (readings === null) throw new Error("Room-specific sensor readings fetch failed - returned null")

    if (readings.id.length === 0) {
        console.log("No new batches this time")
        return
    }

    console.log("pollServerForNewReadings - prisma query returned: ", readings)
    
    /*Update the cursor with the newest reading ID */
    batchCursor.value = readings.id[readings.id.length-1]
    console.log("New cursor:", batchCursor.value)

    //Basically, if there are fewer points on the chart than N, then keep "adding" onto the chart
    //but if the number of readings exceeds N, then remove k oldest records, where k is the number of new records
    chartDataTRCReadings.value.id = chartDataTRCReadings.value.id.concat(readings.id)
    chartDataTRCReadings.value.temp = chartDataTRCReadings.value.temp.concat(readings.temp)
    chartDataTRCReadings.value.rehu = chartDataTRCReadings.value.rehu.concat(readings.rehu)
    chartDataTRCReadings.value.co2c = chartDataTRCReadings.value.co2c.concat(readings.co2c)
    chartTime.value = chartTime.value.concat(...formatDatesToHourMinute(readings.time))

    if (chartDataTRCReadings.value.id.length > nDataPointsOnChart.value){
        const nOldRecordsToRemove = readings.id.length //N old records to remove == new records fetched
        chartDataTRCReadings.value.id = chartDataTRCReadings.value.id.slice(nOldRecordsToRemove)
        chartDataTRCReadings.value.temp = chartDataTRCReadings.value.temp.slice(nOldRecordsToRemove)
        chartDataTRCReadings.value.rehu = chartDataTRCReadings.value.rehu.slice(nOldRecordsToRemove)
        chartDataTRCReadings.value.co2c = chartDataTRCReadings.value.co2c.slice(nOldRecordsToRemove)
        chartTime.value = chartTime.value.slice(nOldRecordsToRemove)
    }

    console.log("Data currently in charts:", chartDataTRCReadings.value.temp)
    console.log("Time points on chart:", chartTime.value)
}

function calcDateDiff(dateA: string|undefined, dateB: string|undefined): number | null{

    if (dateA === undefined || dateB === undefined) return null

    const dateTimestampA = new Date(dateA).getTime()
    const dateTimestampB = new Date(dateB).getTime()

    const diffTime = Math.abs(dateTimestampA - dateTimestampB)
    const diffDays = Math.ceil(diffTime / (1000*60*60*24))
    return diffDays

}

/* Fetches readings from the sensor between dates A and B. 
Those readings are saved to the ref that stores sensor data (chartDataTRCReadings) without
truncating to 24 readings - instead, they will be decimated by a ChartJS plugin*/
async function getReadingsFromDateToDate() {

    if (pollServerInterval !== null) clearInterval(pollServerInterval)
    pollServerInterval = null

    //TODO: check if this works
    const readings = await useFetch<SingleSensorReadingsType>(`/api/sensors/${sensorIqrfID.value}/readings?dateA=${dateA.value}&dateB=${dateB.value}`)
        .then(res => res.data.value)
        .catch(err => console.log(err))

    if (readings === undefined) throw new Error("Sensor readings fetch encountered an error and has not retrieved data from DB")
    //there isnt really a case in my API route to return null, but ig useFetch can possibly return it if something goes bad?
    else if (readings === null) throw new Error("Room-specific sensor readings fetch failed - returned null")

    console.log("n fetched records:", readings.id.length)

    //Decimate - cant get ChartJS to do its own decimation (maybe coz im using custom labels in datasets?)
    const decimationFactor = Math.ceil(readings.id.length / nDataPointsOnChart.value)
    console.log(decimationFactor)

    readings.id = readings.id.filter((el, i) => i % decimationFactor === 0)
    readings.time = readings.time.filter((el, i) => i % decimationFactor === 0)
    readings.temp = readings.temp.filter((el, i) => i % decimationFactor === 0)
    readings.rehu = readings.rehu.filter((el, i) => i % decimationFactor === 0)
    readings.co2c = readings.co2c.filter((el, i) => i % decimationFactor === 0)

    // //save readings
    chartDataTRCReadings.value = readings

    //Decide on time-axis labels. Times are undefined if no readings were fetched
    const daysOfDifference = calcDateDiff(readings.time.at(0), readings.time.at(-1))
    if (daysOfDifference === null) return //no readings within that time period - readings.time is an empty array
    
    //This could be handled in a smarter way
    if (daysOfDifference <= 1){
        chartTime.value = formatDatesToHourMinute(readings.time)
    }
    else if (daysOfDifference > 1 && daysOfDifference <= 14){
        chartTime.value = formatDatesToHourDayMonth(readings.time)
    }
    else if (daysOfDifference > 14 && daysOfDifference <= 30){
        chartTime.value = formatDatesToDayMonth(readings.time)
    }
    else {
        chartTime.value = formatDatesToDayMonthYear(readings.time)
    }
}

watch(() => chartDataTRCReadings.value, (newReadings, oldReadings) => {
    tempChartBgColorUpdate(newReadings.temp.at(-1), DisplayType.Temp)
    rehuChartBgColorUpdate(newReadings.rehu.at(-1), DisplayType.Rehu)
    co2cChartBgColorUpdate(newReadings.co2c.at(-1), DisplayType.CO2c)
}, {deep: true})


var pollServerInterval: null|NodeJS.Timeout = setInterval(() => {
    pollServerForNewReadings()
}, msClientServerPollDelay)


/* https://stackoverflow.com/questions/2809688/directory-chooser-in-html-page */

</script>


<style>

    #large {
        font-size: clamp(1.25rem, 2vw, 2rem)
    }

    @media (max-width: 750px){
        #small {
            display: flex;
            font-size: clamp(1rem, 4vw, 1.25rem);
        }
        #large {
            display: none;
        }
    }

</style>