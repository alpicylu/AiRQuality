<template>

    <div class="flex flex-initial h-full w-full">

        <div class="basis-1/2 flex flex-col flex-auto justify-between gap-4 min-w-0">

            <div class="basis-1/12 flex justify-center items-center">SALA</div>

            <div class="basis-3/12 flex flex-initial justify-center items-center">
                <h1 class="w-2/12 break-all">Temperature</h1>
                <div class="w-10/12 h-full"><Line :data="tempChartReactiveData" :options="chartReactiveOptions"/></div>
            </div>

            <div class="basis-3/12 flex flex-initial justify-center items-center">
                <h1 class="w-2/12 break-all">Rel. humidity</h1>
                <div class="w-10/12 h-full"><Line :data="rehuChartReactiveData" :options="chartReactiveOptions"/></div>
            </div>

            <div class="basis-3/12 flex flex-initial justify-center items-center">
                <h1 class="w-2/12 break-all">CO2 content</h1>
                <div class="w-10/12 h-full"><Line :data="co2cChartReactiveData" :options="chartReactiveOptions"/></div>
            </div>


            <div class="basis-1/12 flex justify-around items-center">
                <button>DATE A</button>
                <button>DATE B</button>
            </div>

        </div>

        <div class="basis-1/2 flex flex-col flex-auto justify-between">
            <table class="basis-1/12">
                <tr>
                    <th>NOW</th>
                    <th>MIN</th>
                    <th>MAX</th>
                    <th>AVG</th>
                </tr>
            </table>

            <table class="basis-9/12">
                <tr>
                    <td>a</td>
                    <td>b</td>
                    <td>c</td>
                    <td>c</td>
                </tr>
                <tr>
                    <td>d</td>
                    <td>e</td>
                    <td>f</td>
                    <td>f</td>
                </tr>
                <tr>
                    <td>g</td>
                    <td>h</td>
                    <td>i</td>
                    <td>i</td>
                </tr>
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
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

onMounted(() => {
    try {
        getFirstBatchSensorData()
    } catch (err) {
        console.log("Failed to get first batch of chart data")
    }
})

const chartBgColor = ref<string>('')
const chartDataTRCReadings = ref<SingleSensorReadingsType>(<SingleSensorReadingsType>{}) //this is where fetched data is saved
const sensorIqrfID = ref<string|undefined>('') //route param is room number, but api fetches are done through sensor IQRF ID
const roomNumber = ref<string>('')

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
        labels: chartDataTRCReadings.value?.time, 
        datasets: [{
            data: chartDataTRCReadings.value?.temp,
            tension: 0.4,
            borderColor: '#000000',
            color: '#000000',
            fontColor: '#000000'
        }]
    }
})

const rehuChartReactiveData = computed(()=> {
    return {
        labels: chartDataTRCReadings.value?.time, 
        datasets: [{
            data: chartDataTRCReadings.value?.rehu,
            tension: 0.4,
            borderColor: '#000000',
            color: '#000000',
            fontColor: '#000000'
        }]
    }
})

const co2cChartReactiveData = computed(()=> {
    return {
        labels: chartDataTRCReadings.value?.time, 
        datasets: [{
            data: chartDataTRCReadings.value?.co2c,
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
})

async function getFirstBatchSensorData(){
    const route = useRoute()

    const roomNumberFromRoute: string = route.params.room as string
    if (roomNumberFromRoute === undefined) throw new Error(" 'room' route parameter is undefined ")

    roomNumber.value = roomNumberFromRoute.replace('_', ' ')

    const {data} = await useFetch(`/api/sensors?room=${roomNumber.value}`)
    if (data.value === null) throw new Error("Failed to fetch specified sensor")

    sensorIqrfID.value = data.value.sensors.at(0)?.iqrfId


}

</script>


<style>

    td {
        text-align: center; 
        vertical-align: middle;
    }

    tr>td {
        border-right: solid gray;
    }

    tr>td:last-of-type {
        border-style: none;
    }

</style>