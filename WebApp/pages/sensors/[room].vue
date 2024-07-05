<template>

    <div id="large" class="flex-1 flex flex-col gap-4 mb-4 justify-around items-stretch w-full ">

        <PrimeToast position="bottom-left"/>

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

        <DetailViewLargeChartStat class="flex-auto min-h-32" :data="tempReadings" :times="chartTime" :readingType="DisplayType.Temp" />
        <DetailViewLargeChartStat class="flex-auto min-h-32" :data="rehuReadings" :times="chartTime" :readingType="DisplayType.Rehu" />
        <DetailViewLargeChartStat class="flex-auto min-h-32" :data="co2cReadings" :times="chartTime" :readingType="DisplayType.CO2c" />

        <div id="controls" class="flex flex-initial justify-evenly items-stretch">
            <DatePicker v-model:date="dateA" ph-text="From" class="flex-initial w-48"/>
            <DatePicker v-model:date="dateB" :min-date="dateA" ph-text="To" class="flex-initial w-48"/>
            <button @click="getReadingsFromDateToDate" class="rounded-full p-3">Apply</button>
            <button @click="getBatchAndFormat" class="rounded-full p-3">Default</button>
            <button @click="buttonTestFunction" class="rounded-full p-3">CSV</button>
        </div>

    </div>

    <!-- Phone layout -->

    <div id="small" class="hidden flex-col w-full h-full px-4 gap-4">

        <h1 class="basis-1/12 flex justify-center items-center mt-4">{{ fetchedSensorData.at(0)?.room }} (ID: {{ fetchedSensorData.at(0)?.iqrfId }})</h1>

        <div class="basis-10/12 flex flex-col justify-around gap-2">
            <DetailViewSmallChartStat :data="tempReadings" :times="chartTime" :readingType="DisplayType.Temp" />
            <DetailViewSmallChartStat :data="rehuReadings" :times="chartTime" :readingType="DisplayType.Rehu" />
            <DetailViewSmallChartStat :data="co2cReadings" :times="chartTime" :readingType="DisplayType.CO2c" />
        </div>

        <button class="basis-1/12 flex justify-stretch mb-4 rounded-full" @click="bottomSidebarVisible = true">
            <i class="pi pi-arrow-up p-3 mx-auto"></i>
        </button>

        <PrimeSidebar v-model:visible="bottomSidebarVisible" header="Options" position="bottom">
            <div class="flex flex-col justify-center items-stretch gap-5 text-xl">

                <div class="flex justify-stretch items-center gap-4">
                    <DatePicker v-model:date="dateA" ph-text="From" class="flex-1 h-10"/>
                    <DatePicker v-model:date="dateB" :min-date="dateA" ph-text="To" class="flex-1 h-10"/>
                </div>

                <button id="date-submit" @click="getReadingsFromDateToDate" class="flex justify-around items-center flex-1 rounded-full p-2 h-10">
                    <span class="w-20">Confirm</span>
                    <i class="pi pi-check"></i>
                </button>
                <button @click="getBatchAndFormat" class="flex justify-around items-center flex-1 rounded-full p-2 h-10">
                    <span class="w-20">Default</span>
                    <i class="pi pi-refresh"></i>
                </button>
                <button @click="buttonTestFunction" class="flex justify-around items-center flex-1 rounded-full p-2 h-10">
                    <span class="w-20">CSV</span>
                    <i class="pi pi-download"></i>
                </button>

            </div>
        </PrimeSidebar>
    </div>

</template>

<script setup lang="ts">
import { Chart, Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'
import type { SingleSensorReadingsType } from '~/types/types';
import { DisplayType } from '~/types/enums';
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)
import ToastService from 'primevue/toastservice'

import { useToast } from "primevue/usetoast";
const toast = useToast()

import {formatDates, getFormatBasedOnDateDiff} from '~/utils/formatDateTimeStrings'
import {msClientServerPollDelay} from "~/constants/constants"
import type { ToastMessageOptions } from 'primevue/toast';

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

const showToastNoReadings = () => {
    toast.add({
        severity: "warn", 
        summary: "No readings found",
        detail: "No readings found from the specified time period",
        life: 5000,
    })
}

const showToastPickDateRange = () => {
    toast.add({
        severity: "info", 
        summary: "No dates chosen",
        detail: "Pick a 'From' and 'To' date in order to download data from a specified date range",
        life: 5000,
    })
}

const bottomSidebarVisible = ref(false)

const chartTime = ref<string[]>([])

const roomNumber = (useRoute().params.room as string).replace('_', ' ')

const nDataPointsOnChart = ref(24)

//This used to just take in a string, does it still work with the calls to the db?
const dateA = ref<Date|undefined>(undefined)
const dateB = ref<Date|undefined>(undefined)

const sensorIqrfID = computed(()=> {
    return fetchedSensorData.value.at(0)?.iqrfId
})

/**I need to alternate the source of charts while turning "off" the live feed of data from server
 * I will achieve this through assigning a simple, static array of date-bound readings when choosing to display
 * readings from a time period and assigning the fSD ref (its fields) when opting for the live feed.
 * 
 * I think the type of data representing a static date range should be reactive - how else will the components
 * properly update?
 */
let tempReadings: ComputedRef<number[]> | Array<number> = computed(()=>{
    return fetchedSensorData.value.at(0)?.temp ?? Array<number>()
})

let rehuReadings: ComputedRef<number[]> | Array<number> = computed(()=>{
    return fetchedSensorData.value.at(0)?.rehu ?? Array<number>()
})

let co2cReadings: ComputedRef<number[]> | Array<number> = computed(()=>{
    return fetchedSensorData.value.at(0)?.co2c ?? Array<number>()
})

const {fetchedSensorData, getFirstBatchSensorData, pollServerForNewReadings} = useGetSensorData()

//fetch can return null, we want to avoid the possibility of passing that into a chart component (because they cant handle that)

async function buttonTestFunction(){
    // debugger
    if (!dateA.value || !dateB.value){
        showToastPickDateRange()
        return
    }
    await useFetch(`/api/sensors/${sensorIqrfID.value}/readings?&dateA=${dateA.value}&dateB=${dateB.value}`)
        .then(res => {
            if (res.data.value !== null) return parseSensorReadingToCSV(res.data.value) 
            throw new Error("Fetch returned null - cannot parse to CSV")
        })
        .then(res => {
            const blob = new Blob([res], { type: 'text/csv' })
            const filenameFromDate = `${new Date().toISOString().slice(0, -5).replace(/:/g, "-")}Z`
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
        URL.revokeObjectURL(url)
        removeEventListener('click', clickHandler)
        }, 150);
    };

    // Add the click event listener on the anchor element
    a.addEventListener('click', clickHandler, false)
    a.click()
    a.removeEventListener('click', clickHandler, false)
}

async function getBatchAndFormat(){
    await getFirstBatchSensorData(nDataPointsOnChart.value, roomNumber).catch(console.error)
    const format = getFormatBasedOnDateDiff(fetchedSensorData.value.at(0)?.time.at(0), fetchedSensorData.value.at(0)?.time.at(-1))

    chartTime.value = formatDates(fetchedSensorData.value.at(0)?.time ?? Array<string>(), format)
    if (pollServerInterval === null) pollServerInterval = setInterval(() => {pollServerForNewReadings(nDataPointsOnChart.value)}, msClientServerPollDelay) 

    /**Switch to "live feed" */
    tempReadings = computed(()=>fetchedSensorData.value.at(0)?.temp ?? Array<number>())
    rehuReadings = computed(()=>fetchedSensorData.value.at(0)?.rehu ?? Array<number>())
    co2cReadings = computed(()=>fetchedSensorData.value.at(0)?.co2c ?? Array<number>())
}
/**Run this function as soon as the renderer reaches this line (i dont think this would fly in SSR)*/
getBatchAndFormat()

/* Fetches readings from the sensor between dates A and B. 
Those readings are saved to the ref that stores sensor data (chartDataTRCReadings) without
truncating to 24 readings - instead, they will be decimated by a ChartJS plugin
Probably should make this a composable, tough its not used anywhere else.
*/
async function getReadingsFromDateToDate() {
    if (!dateA.value || !dateB.value){
        showToastPickDateRange()
        return
    }
    
    if (pollServerInterval !== null) clearInterval(pollServerInterval)
    pollServerInterval = null

    //TODO: check if this works
    const readings = await $fetch<SingleSensorReadingsType>(`/api/sensors/${sensorIqrfID.value}/readings?dateA=${dateA.value}&dateB=${dateB.value}`)
        .then(res => res)
        .catch(err => console.log(err))

    if (readings === undefined) throw new Error("Sensor readings fetch encountered an error and has not retrieved data from DB")
    //there isnt really a case in my API route to return null, but ig useFetch can possibly return it if something goes bad?
    else if (readings === null) throw new Error("Room-specific sensor readings fetch failed - returned null")

    if (readings.co2c.length === 0 && readings.rehu.length === 0 && readings.temp.length === 0){
        showToastNoReadings()
    }

    console.log("n fetched records:", readings.id.length)

    //Decimate - cant get ChartJS to do its own decimation (maybe coz im using custom labels in datasets?)
    const decimationFactor = Math.ceil(readings.id.length / nDataPointsOnChart.value)
    console.log("Decimation factor: ", decimationFactor)

    readings.id = readings.id.filter((el, i) => i % decimationFactor === 0) // i dont think i need to decimate that
    readings.time = readings.time.filter((el, i) => i % decimationFactor === 0)
    readings.temp = readings.temp.filter((el, i) => i % decimationFactor === 0)
    readings.rehu = readings.rehu.filter((el, i) => i % decimationFactor === 0)
    readings.co2c = readings.co2c.filter((el, i) => i % decimationFactor === 0)

    //save readings
    tempReadings = readings.temp
    rehuReadings = readings.rehu
    co2cReadings = readings.co2c

    chartTime.value = formatDates(readings.time, getFormatBasedOnDateDiff(readings.time.at(0), readings.time.at(-1)))
}

var pollServerInterval: null|NodeJS.Timeout = setInterval(async () => {
    await pollServerForNewReadings(nDataPointsOnChart.value)
    //update x axis according to new data
    chartTime.value = formatDates(fetchedSensorData.value.at(0)?.time ?? Array<string>(), 'hh:mm')
}, msClientServerPollDelay)

/**This watcher may seem a bit redundant - why not just pass it into the chart components? it would 
 * update them automatically after all. 
 * Thing is, the charts kinda have two sources - the 'clean' data fetched from the database, and decimated data
 * that represents readings from date A to date B. So whenever i want to display this kind of data, i need to somehow
 * switch the value of the variable the charts are reading from and this is the best way i found.
 * watchEffect evaluates eagerly, watch lazily. Here i need eagerness, otherwise charts will start out blank
 */
// watchEffect(()=>{
//     console.log("watchEffect ran")
//     chartDataReadings.value.id = fetchedSensorData.value.at(0)?.id ?? Array<string>()
//     chartDataReadings.value.temp = fetchedSensorData.value.at(0)?.temp ?? Array<number>()
//     chartDataReadings.value.rehu = fetchedSensorData.value.at(0)?.rehu ?? Array<number>()
//     chartDataReadings.value.co2c = fetchedSensorData.value.at(0)?.co2c ?? Array<number>()
//     debugger
// })

/* https://stackoverflow.com/questions/2809688/directory-chooser-in-html-page */

/**Things to check:
 * is the time axis behaving properly when switching sources. Does it properly update the time-axis when polling regularly?
 * Do live tests to see if charts update
 * Find a way to check if data is displayed properly in charts - right order, right reading, right chart.
 */
provide('dateRange', '')
provide('displayTitle', false)

</script>


<style>

    #large {
        font-size: clamp(1.25rem, 2vw, 2rem)
    }
    #controls {
        font-size: clamp(1.25rem, 2vw, 1.75rem)
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