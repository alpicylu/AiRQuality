<template>

    <div id="large" class="flex-1 flex flex-col gap-4 mb-4 justify-around items-stretch w-full ">

        <div class="flex-initial grid grid-cols-9 grid-rows-1">
            <div class="row-start-1 col-start-2 row-span-1 col-span-4 flex justify-center items-center">
                <h1>{{ fetchedSensorData.at(0)?.room }} (ID: {{ fetchedSensorData.at(0)?.iqrfId }})</h1>
            </div>
            <div class="row-start-1 col-start-6 row-span-1 col-span-4 flex justify-around items-center basis-1/2 ">
                <h2>Now</h2>
                <h2>Max</h2>
                <h2>Min</h2>
                <h2>Avg</h2>
            </div>
        </div>

        <DetailViewLargeChartStat class="flex-auto min-h-32" :data="chartDataReadings.temp" :times="chartTime" :readingType="DisplayType.Temp" />
        <DetailViewLargeChartStat class="flex-auto min-h-32" :data="chartDataReadings.rehu" :times="chartTime" :readingType="DisplayType.Rehu" />
        <DetailViewLargeChartStat class="flex-auto min-h-32" :data="chartDataReadings.co2c" :times="chartTime" :readingType="DisplayType.CO2c" />

        <div class="flex flex-initial justify-evenly items-center">
            <DatePicker v-model:pickerDate="dateA" class="min-w-min"/>
            <DatePicker v-model:pickerDate="dateB" class="min-w-min"/>
            <button @click="getReadingsFromDateToDate" class="rounded-full p-3">Apply</button>
            <button @click="getBatchAndFormat" class="rounded-full p-3">Default</button>
            <button @click="buttonTestFunction" class="rounded-full p-3">CSV</button>
        </div>

    </div>

    <!-- Phone layout -->

    <div id="small" class="hidden flex-col w-full h-full px-4 gap-4">

        <h1 class="basis-1/12 flex justify-center items-center mt-4">{{ fetchedSensorData.at(0)?.room }} (ID: {{ fetchedSensorData.at(0)?.iqrfId }})</h1>

        <div class="basis-10/12 flex flex-col justify-around gap-2">
            <DetailViewSmallChartStat :data="chartDataReadings.temp" :times="chartTime" :readingType="DisplayType.Temp" />
            <DetailViewSmallChartStat :data="chartDataReadings.rehu" :times="chartTime" :readingType="DisplayType.Rehu" />
            <DetailViewSmallChartStat :data="chartDataReadings.co2c" :times="chartTime" :readingType="DisplayType.CO2c" />
        </div>

        <div class="basis-1/12 flex justify-stretch mb-4">
            <PrimeButton icon="pi pi-arrow-up" @click="bottomSidebarVisible = true"
                pt:root:class="w-full bg-ext-content p-3"/>
        </div>
        <PrimeSidebar v-model:visible="bottomSidebarVisible" header="Options" position="bottom">
            <div class="flex flex-col justify-center items-stretch gap-5">
                <div class="flex justify-stretch items-center">
                    <span class="w-24">Date From:</span>
                    <DatePicker id="date-a" v-model:pickerDate="dateA" class="flex-1 p-3 h-10"/>
                </div>
                <div class="flex justify-stretch items-center">
                    <span class="w-24">Date To:</span>
                    <DatePicker id="date-b" v-model:pickerDate="dateB" class="flex-1 p-3 h-10"/>
                </div>

                <button id="date-submit" @click="getReadingsFromDateToDate" class="flex justify-around items-center flex-1 bg-ext-margins rounded-full p-2 h-10">
                    <span>Confirm</span>
                    <CheckIcon class="w-6"/>
                </button>

                <button @click="getBatchAndFormat" class="flex justify-around items-center flex-1 bg-ext-margins rounded-full p-2 h-10">
                    <span>Default</span>
                    <ArrowPathIcon class="h-6"/>
                </button>
                <button @click="buttonTestFunction" class="flex justify-around items-center flex-1 bg-ext-margins rounded-full p-2 h-10">
                    <span>CSV</span>
                    <ArrowDownTrayIcon class="h-6"/>
                </button>

            </div>
        </PrimeSidebar>
    </div>

</template>

<script setup lang="ts">
/**Make a retractable "tray" for the controls in the small screen view 
 * https://primevue.org/checkbox/
*/
import { Chart, Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'
import Sidebar from 'primevue/sidebar'
import Button from 'primevue/button'
import type { SingleSensorReadingsType } from '~/types/types';
import { DisplayType } from '~/types/enums';
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

import {formatDatesToHourMinute, formatDatesToHourDayMonth, formatDatesToDayMonth, formatDatesToDayMonthYear} from "~/utils/formatDateTimeStrings"
import {msClientServerPollDelay} from "~/constants/constants"

import { CalendarDaysIcon as CalendarOutline, CheckIcon, ArrowPathIcon, ArrowDownTrayIcon } from "@heroicons/vue/24/outline"
import { CalendarDaysIcon as CalendarSolid } from "@heroicons/vue/24/solid"

/**Upon navigating to this URL, check if the sensor name present in the URL exists in the DB. */
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

            if (!exists) return abortNavigation()
        }
    ]
})

onUnmounted(() => {
    if (pollServerInterval !== null) {
        clearInterval(pollServerInterval)
        pollServerInterval = null
    }
})

const bottomSidebarVisible = ref(false)

const chartDataReadings = ref<SingleSensorReadingsType>(<SingleSensorReadingsType>{}) //this is where fetched data is saved
const chartTime = ref<string[]>([])

const roomNumber = (useRoute().params.room as string).replace('_', ' ')

const nDataPointsOnChart = ref(24)

const dateA = ref('')
const dateB = ref('')

const sensorIqrfID = computed(()=> {
    return fetchedSensorData.value.at(0)?.iqrfId
})

const {fetchedSensorData, getFirstBatchSensorData, pollServerForNewReadings} = useGetSensorData()

//fetch can return null, we want to avoid the possibility of passing that into a chart component (because they cant handle that)

async function buttonTestFunction(){
    await useFetch(`/api/sensors/${sensorIqrfID.value}/readings?&dateA=${dateA.value}&dateB=${dateB.value}`)
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
    a.removeEventListener('click', clickHandler, false)
}

async function getBatchAndFormat(){
    await getFirstBatchSensorData(nDataPointsOnChart.value, roomNumber).catch(console.error)
    chartTime.value = formatDatesToHourMinute(fetchedSensorData.value.at(0)!.time)
    if (pollServerInterval === null) pollServerInterval = setInterval(() => {pollServerForNewReadings(nDataPointsOnChart.value)}, msClientServerPollDelay) 
}
/**Run this function as soon as the renderer reaches this line (i dont think this would fly in SSR)*/
getBatchAndFormat()

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
truncating to 24 readings - instead, they will be decimated by a ChartJS plugin
Probably should make this a composable, tough its not used anywhere else.
*/
async function getReadingsFromDateToDate() {

    if (pollServerInterval !== null) clearInterval(pollServerInterval)
    pollServerInterval = null

    //TODO: check if this works
    const readings = await $fetch<SingleSensorReadingsType>(`/api/sensors/${sensorIqrfID.value}/readings?dateA=${dateA.value}&dateB=${dateB.value}`)
        .then(res => res)
        .catch(err => console.log(err))

    if (readings === undefined) throw new Error("Sensor readings fetch encountered an error and has not retrieved data from DB")
    //there isnt really a case in my API route to return null, but ig useFetch can possibly return it if something goes bad?
    else if (readings === null) throw new Error("Room-specific sensor readings fetch failed - returned null")

    // debugger
    console.log("n fetched records:", readings.id.length)

    //Decimate - cant get ChartJS to do its own decimation (maybe coz im using custom labels in datasets?)
    const decimationFactor = Math.ceil(readings.id.length / nDataPointsOnChart.value)
    console.log(decimationFactor)

    readings.id = readings.id.filter((el, i) => i % decimationFactor === 0) // i dont think i need to decimate that
    readings.time = readings.time.filter((el, i) => i % decimationFactor === 0)
    readings.temp = readings.temp.filter((el, i) => i % decimationFactor === 0)
    readings.rehu = readings.rehu.filter((el, i) => i % decimationFactor === 0)
    readings.co2c = readings.co2c.filter((el, i) => i % decimationFactor === 0)

    // //save readings
    chartDataReadings.value = readings    

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

var pollServerInterval: null|NodeJS.Timeout = setInterval(() => {
    pollServerForNewReadings(nDataPointsOnChart.value)
}, msClientServerPollDelay)

/**This watcher may seem a bit redundant - why not just pass it into the chart components? it would 
 * update them automatically after all. 
 * Thing is, the charts kinda have two sources - the 'clean' data fetched from the database, and decimated data
 * that represents readings from date A to date B. So whenever i want to display this kind of data, i need to somehow
 * switch the value of the variable the charts are reading from and this is the best way i found.
 * watchEffect evaluates eagerly, watch lazily. Here i need eagerness, otherwise charts will start out blank
 */
watchEffect(()=>{
    console.log(fetchedSensorData.value.at(0))
    chartDataReadings.value.id = fetchedSensorData.value.at(0)?.id ?? Array<string>()
    chartDataReadings.value.temp = fetchedSensorData.value.at(0)?.temp ?? Array<number>()
    chartDataReadings.value.rehu = fetchedSensorData.value.at(0)?.rehu ?? Array<number>()
    chartDataReadings.value.co2c = fetchedSensorData.value.at(0)?.co2c ?? Array<number>()
})

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

    /* #grid {
        grid-template-areas: 
        'dateA dateB submit';
    }
    #date-a {
        grid-area: dateA;
    }
    #date-b {
        grid-area: dateB;
    }
    #date-submit {
        grid-area: submit;
    }
    @media (max-width: 400px){
        #grid {
            grid-template-areas: 
            'dateA dateA submit'
            'dateB dateB submit'; 
        }
    } */

</style>