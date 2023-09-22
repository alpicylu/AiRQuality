<template>
    <div class="h-64 grid grid-cols-6 my-8">
        <div class="row-span-6 col-span-1 bg-ext-content flex justify-start items-center text-5xl"> {{ room }} </div>
        <div class="relative h-full w-full col-start-2 row-span-6 col-span-3">
            <Line id="chart1" :options="chartOptions" :data="bogusData" :plugins="[backgroundColorPlugin]"/>
        </div>
        <form class="col-start-5 row-span-6 col-span-2 bg-ext-content grid grid-cols-5 place-content-around text-4xl">
            <input type="radio" class="col-start-1 row-start-1" :id="room + 'temp'" :value=DisplayType.Temp :name="room" v-model="radioButtonsRead" :checked=tempCheck>
            <label class="grid-col" :for="room + 'temp'">T</label>
            <div class="col-span-3 flex justify-end items-center"> 23 &#8451; </div>

            <input type="radio" class="col-start-1 row-start-2" :id="room + 'rehu'" :value=DisplayType.Rehu :name="room" v-model="radioButtonsRead" :checked="rehuCheck">
            <label class="col-start-2" :for="room + 'rehu'">RH</label>
            <div class="col-span-3 flex justify-end items-center"> 23 % </div>

            <input type="radio" class="col-start-1 row-start-3" :id="room + 'co2c'" :value=DisplayType.CO2c :name="room" v-model="radioButtonsRead" :checked="co2cCheck">
            <label class="col-start-2" :for="room + 'co2c'">CO2</label>
            <div class="col-span-3 flex justify-end items-end"> 230 ppm </div>
        </form>
    </div>
    <div class="bg-ext-margins h-1 rounded-full w-full mx-auto"></div>
</template>

<script setup lang="ts">
// tree-shakable imports
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'
import {DisplayType, sensorDataType} from '../types/types'
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

//For whatever reason, once the charts are fully loaded they set the radio buttons' checked property to false, and
//i want the temperature button to be enabled by default.
//To circumvent that, it set teh checked prop to false at first, wait untill the component fully loads, and then set it to true
//which works marvelously
const tempCheck = ref(false)
onMounted(() => {
    tempCheck.value = true
})
const rehuCheck = ref(false)
const co2cCheck = ref(false)

const props = defineProps<{
    room: string
    checkAllRadios: DisplayType
    sensorData?: sensorDataType[]
}>()

const chartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
})

//Chart data we pass to the chart element. Vue-chartjs needs it to be a computed property if we want the data to be dynamic
//see vue-chartjs docs
const chartData = ref<number[]>([])
const bogusData = computed(() => { 
    return {
        labels: [...Array(chartData.value.length).keys()],
        datasets: [{ 
            data: chartData.value,
            label: 'Temperature',
            backgroundColor: '#DA4167',
            borderColor: '#7C90DB'
        }]
    }
})

//the plugin that we pass to the graph that allows for changing the bg color. 
//since i also want this color to change in certain cases, i defined a ref
//and referenced it in the plugin. Changing the ref value will change the bg color
const chartBgColor = ref('#00CC99')
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

function getReadingFromSensorData(type: DisplayType){
    // console.log(props.sensorData)
    var tempArr: number[] = []

    switch (type){
        case DisplayType.Temp:
            props.sensorData?.forEach((elem, index) => {
                tempArr.push(elem.temp)
            })
    }
    switch (type){
        case DisplayType.Rehu:
            props.sensorData?.forEach((elem, index) => {
                tempArr.push(elem.rehu)
            })
    }
    switch (type){
        case DisplayType.CO2c:
            props.sensorData?.forEach((elem, index) => {
                tempArr.push(elem.co2c)
            })
    }

    chartData.value = tempArr //is this a deep copy? should i be worried?
}

// getReadingFromSensorData(DisplayType.Temp) 
//i need to run this function once the data has been fetched from the API
//this function is ran too early - when the default 0-ed object array is still the current dataset, before the fetched
//data is relayed to this component

//I need to give myself more credit for this.
//Previously i had a problem where the charts would display data only when i would hot-reload them, or something like that.
//Whatever the core issue was, this watch seems to solve it.
//What really happens is:
//  the ref() in index.vue that v-binds to chart's sensorData prop starts with an array of zeroed objects that are immediately
//sent to the charts
//  the fetch is called and takes about a second to provide the app with data
//  the charts render those zeroes resulting in all flat lines accross all charts
//  the fetch request concludes and saves data the ref() that if v-bound to the charts
//  the below watcher notices the change in the prop, splits and saves data to the array that holds data to be displayed
watch(() => props.sensorData, (newData, oldData) => {
    console.log("Sensor data watcher triggered")

    getReadingFromSensorData(DisplayType.Temp)
})


//I want the value from the "display" dropdown to set the checked status on all apropriate checkboxes
//watching props requires "wraping" the prop in a lambda
watch(() => props.checkAllRadios, (newCheck, oldCheck) => {
    if (newCheck === DisplayType.Temp){
        rehuCheck.value = co2cCheck.value = false
        tempCheck.value = true
        radioButtonsRead.value = newCheck
    }
    else if (newCheck === DisplayType.Rehu){
        tempCheck.value = co2cCheck.value = false
        rehuCheck.value = true
        radioButtonsRead.value = newCheck
    }
    else if (newCheck === DisplayType.CO2c){
        rehuCheck.value = tempCheck.value = false
        co2cCheck.value = true
        radioButtonsRead.value = newCheck
    }
})

//change charts (presented data and bg color) depending on which radio button is active 
var radioButtonsRead = ref(DisplayType.Temp);
watch(radioButtonsRead, (newRead, oldread) => {
    console.log("current radio value:", newRead)
    if (newRead === DisplayType.Temp){
        getReadingFromSensorData(DisplayType.Temp) //make an api call to fetch data here
        chartBgColor.value = '#00CC99'
    }
    else if (newRead === DisplayType.Rehu){
        getReadingFromSensorData(DisplayType.Rehu)
        chartBgColor.value = '#FFEE88'
    }
    else if (newRead === DisplayType.CO2c){
        getReadingFromSensorData(DisplayType.CO2c)
        chartBgColor.value = '#DD1155'
    }
})
 

</script>