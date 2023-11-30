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
                <button>DATE A</button>
                <button>DATE B</button>
            </div>

        </div>

        <div class="basis-1/2 flex flex-col flex-auto justify-between gap-4">
            <table class="basis-1/12">
                <tr class="h-1/6">
                    <th>NOW</th>
                    <th>MIN</th>
                    <th>MAX</th>
                    <th>AVG</th>
                </tr>
            </table>
            <table class="basis-10/12">
                <DetailViewTableRow :sensorReadings="chartDataTRCReadings.temp"/>
                <DetailViewTableRow :sensorReadings="chartDataTRCReadings.rehu"/>
                <DetailViewTableRow :sensorReadings="chartDataTRCReadings.co2c"/>
            </table>
            
            <div class="basis-1/12 flex justify-around items-center">
                <button>CSV</button>
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

watch(chartDataTRCReadings.value, (newReadings, oldReadings) => {
    tempChartBgColorUpdate(newReadings.temp, DisplayType.Temp)
    rehuChartBgColorUpdate(newReadings.temp, DisplayType.Rehu)
    co2cChartBgColorUpdate(newReadings.temp, DisplayType.CO2c)
})

async function pollServerForNewReadings(){

    const readings = await useFetch<SingleSensorReadingsType>(
        `/api/sensors/${sensorIqrfID.value}/readings?take=${nDataPointsOnChart.value}&cursor=${chartDataTRCReadings.value.id.at(-1)}`
    )
    .then(res => res.data.value)
    .catch(err => {
        console.log(err)
    })

    if (readings === undefined) throw new Error("Sensor readings fetch encountered an error and has not retrieved data from DB")

    if (readings === null) {
        console.log("No new batches this time")
        return
    }
    chartDataTRCReadings.value.id = chartDataTRCReadings.value.id.concat(readings.id)
    chartDataTRCReadings.value.time = chartDataTRCReadings.value.time.concat(readings.time)
    chartDataTRCReadings.value.temp = chartDataTRCReadings.value.temp.concat(readings.temp)
    chartDataTRCReadings.value.rehu = chartDataTRCReadings.value.rehu.concat(readings.rehu)
    chartDataTRCReadings.value.co2c = chartDataTRCReadings.value.co2c.concat(readings.co2c)

    if (chartDataTRCReadings.value.id.length > nDataPointsOnChart.value){
        const nOldRecordsToRemove = readings.id.length 
        chartDataTRCReadings.value.id = chartDataTRCReadings.value.id.slice(nOldRecordsToRemove)
        chartDataTRCReadings.value.time = chartDataTRCReadings.value.time.slice(nOldRecordsToRemove)
        chartDataTRCReadings.value.temp = chartDataTRCReadings.value.temp.slice(nOldRecordsToRemove)
        chartDataTRCReadings.value.rehu = chartDataTRCReadings.value.rehu.slice(nOldRecordsToRemove)
        chartDataTRCReadings.value.co2c = chartDataTRCReadings.value.co2c.slice(nOldRecordsToRemove)
    }
}

const pollServerInterval = setInterval(() => {
    pollServerForNewReadings()
}, 1000*60)

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