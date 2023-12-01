<template>

    <div class="flex flex-initial h-full w-full">

        <div class="basis-1/2 flex flex-col flex-auto justify-between gap-4 min-w-0">

            <div class="basis-1/12 flex justify-center items-center">SALA</div>

            <div class="basis-3/12 flex flex-initial justify-center items-center">
                <h1 class="w-2/12 break-all text-center">Temperature</h1>
                <div class="w-10/12 h-full"><Line :data="tempChartReactiveData" :options="chartReactiveOptions" :plugins="[backgroundColorPluginTempChart]"/></div>
            </div>

            <div class="basis-3/12 flex flex-initial justify-center items-center">
                <h1 class="w-2/12 break-all text-center">Rel. humidity</h1>
                <div class="w-10/12 h-full"><Line :data="rehuChartReactiveData" :options="chartReactiveOptions" :plugins="[backgroundColorPluginRehuChart]"/></div>
            </div>

            <div class="basis-3/12 flex flex-initial justify-center items-center">
                <h1 class="w-2/12 break-all text-center">CO2 content</h1>
                <div class="w-10/12 h-full"><Line :data="co2cChartReactiveData" :options="chartReactiveOptions" :plugins="[backgroundColorPluginCo2cChart]"/></div>
            </div>


            <div class="basis-1/12 flex justify-around items-center">
                <DatePicker v-model:pickerDate="dateA"/>
                <DatePicker v-model:pickerDate="dateB"/>
            </div>

        </div>

        <div class="basis-1/2 flex flex-col flex-auto justify-between gap-4">
            <div class="basis-1/12 flex justify-around items-center">
                <h1>NOW</h1>
                <h1>MAX</h1>
                <h1>MIN</h1>
                <h1>AVG</h1>
                <h1>UNIT</h1>
            </div>


            <div class="basis-3/12 flex justify-around items-center">
                <DetailViewTableRow :sensorReadings="chartDataTRCReadings.temp" :readingType="DisplayType.Temp"/>
            </div>

            <div class="basis-3/12 flex justify-around items-center">
                <DetailViewTableRow :sensorReadings="chartDataTRCReadings.rehu" :readingType="DisplayType.Rehu"/>
            </div>

            <div class="basis-3/12 flex justify-around items-center">
                <DetailViewTableRow :sensorReadings="chartDataTRCReadings.co2c" :readingType="DisplayType.CO2c"/>
            </div>


            <div class="basis-1/12 flex justify-center items-center">
                CSV
            </div>

        </div>
    </div>

</template>


<script setup lang="ts">
import { Chart, Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'
import type { SingleSensorReadingsType } from '~/types/types';
import { DisplayType } from '~/types/enums';
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

onMounted(() => {
    getFirstBatchSensorData()
        .catch(err => console.log(err))
})

onUnmounted(() => {
    clearInterval(pollServerInterval)
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

const chartReactiveOptions = computed(()=> {
    return {
        responsive: true,
        maintainAspectRatio: false,
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
            fontColor: '#000000'
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

async function getFirstBatchSensorData(){
    const route = useRoute()

    const roomNumberFromRoute: string = route.params.room as string
    if (roomNumberFromRoute === undefined) throw new Error(" 'room' route parameter is undefined ")

    roomNumber.value = roomNumberFromRoute.replace('_', ' ')

    const sensor = await useFetch(`/api/sensors?room=${roomNumber.value}`)
        .then(res => res.data.value?.sensors.at(0)?.iqrfId)
    if (sensor === null || sensor === undefined) throw new Error("Failed to fetch specified sensor")
    sensorIqrfID.value = sensor

    const readings = await useFetch<SingleSensorReadingsType>(`/api/sensors/${sensorIqrfID.value}/readings`)
        .then(res => res.data.value)
        .catch(err => console.log(err))
    if (readings === null || readings === undefined) throw new Error("Failed to fetch sensor readings for the specified sensor")
    chartDataTRCReadings.value = readings
    chartTime.value = formatDatesToHourMinute(chartDataTRCReadings.value.time)
}



async function pollServerForNewReadings(){

    const readings = await useFetch<SingleSensorReadingsType>(
        `/api/sensors/${sensorIqrfID.value}/readings?take=${nDataPointsOnChart.value}&cursor=${chartDataTRCReadings.value.id.at(-1)}`
    )
    .then(res => {
        console.log(res.data.value)
        return res.data.value
    })
    .catch(err => {
        console.log(err)
    })

    if (readings === undefined) throw new Error("Sensor readings fetch encountered an error and has not retrieved data from DB")
    else if (readings === null) throw new Error("Room-specific sensor readings fetch failed - returned null")

    if (readings.id.length === 0) {
        console.log("No new batches this time")
        return
    }

    chartDataTRCReadings.value.id = chartDataTRCReadings.value.id.concat(readings.id)
    chartDataTRCReadings.value.temp = chartDataTRCReadings.value.temp.concat(readings.temp)
    chartDataTRCReadings.value.rehu = chartDataTRCReadings.value.rehu.concat(readings.rehu)
    chartDataTRCReadings.value.co2c = chartDataTRCReadings.value.co2c.concat(readings.co2c)
    chartTime.value.push(...formatDatesToHourMinute(readings.time))

    if (chartDataTRCReadings.value.id.length > nDataPointsOnChart.value){
        const nOldRecordsToRemove = readings.id.length 
        chartDataTRCReadings.value.id = chartDataTRCReadings.value.id.slice(nOldRecordsToRemove)
        chartDataTRCReadings.value.temp = chartDataTRCReadings.value.temp.slice(nOldRecordsToRemove)
        chartDataTRCReadings.value.rehu = chartDataTRCReadings.value.rehu.slice(nOldRecordsToRemove)
        chartDataTRCReadings.value.co2c = chartDataTRCReadings.value.co2c.slice(nOldRecordsToRemove)
        chartTime.value.slice(nOldRecordsToRemove)
    }

    console.log("data points on chart: ", chartDataTRCReadings.value.id.length)
}

watch(() => chartDataTRCReadings.value, (newReadings, oldReadings) => {
    tempChartBgColorUpdate(newReadings.temp, DisplayType.Temp)
    rehuChartBgColorUpdate(newReadings.rehu, DisplayType.Rehu)
    co2cChartBgColorUpdate(newReadings.co2c, DisplayType.CO2c)
    console.log(tempChartBgColor, rehuChartBgColor, co2cChartBgColor)
    console.log("room watcher run")
}, {deep: true})

// const test = setInterval(() => {
//     chartDataTRCReadings.value.temp.push(7)
//     chartDataTRCReadings.value.rehu.push(7)
//     chartDataTRCReadings.value.co2c.push(7)
//     chartDataTRCReadings.value.id.push("asdgd")
//     chartDataTRCReadings.value.time.push(new Date().toISOString())
// }, 1000*3)

const pollServerInterval = setInterval(() => {
    pollServerForNewReadings()
}, 1000*30)

</script>


<style>

    td, th {
        text-align: center; 
        vertical-align: middle;
    }

    tr>td {
        border-right: solid gray;
    }

    tr>td:last-of-type {
        border-style: none;
        border-width: 0;
    }

</style>