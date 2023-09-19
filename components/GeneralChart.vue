<template>
    <div class="h-64 grid grid-cols-6 my-8">
        <div class="row-span-6 col-span-1 bg-ext-content flex justify-start items-center text-5xl"> {{ room }} </div>
        <div class="relative h-full w-full col-start-2 row-span-6 col-span-3">
            <Line id="chart1" :options="chartOptions" :data="bogusData" :plugins="[backgroundColorPlugin]"/>
        </div>
        <form class="col-start-5 row-span-6 col-span-2 bg-ext-content grid grid-cols-5 place-content-around text-4xl">
            <input type="radio" class="col-start-1 row-start-1" :id="room + 'temp'" value="temp" :name="room" v-model="radioButtonsRead" :checked=tempCheck
                >
            <label class="grid-col" :for="room + 'temp'">T</label>
            <div class="col-span-3 flex justify-end items-center"> 23 &#8451; </div>

            <input type="radio" class="col-start-1 row-start-2" :id="room + 'rehu'" value="rehu" :name="room" v-model="radioButtonsRead" :checked="rehuCheck">
            <label class="col-start-2" :for="room + 'rehu'">RH</label>
            <div class="col-span-3 flex justify-end items-center"> 23 % </div>

            <input type="radio" class="col-start-1 row-start-3" :id="room + 'co2c'" value="co2c" :name="room" v-model="radioButtonsRead" :checked="co2cCheck">
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
    checkAllRadios: string
}>()

const chartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
})

const chartData = ref([10, 20, 40])
const bogusData = computed(() => { 
    return {
        labels: [ 'January', 'February', 'March' ],
        datasets: [{ 
            data: chartData.value,
            label: 'Temperature',
            backgroundColor: '#DA4167',
            borderColor: '#7C90DB'
        }]
    }
})

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

console.log(props.checkAllRadios)

var radioButtonsRead = ref("");
watch(radioButtonsRead, (newRead, oldread) => {
    console.log("current radio value:", newRead)
    if (newRead === 'temp'){
        chartData.value = [10, 20, 40]
        chartBgColor.value = '#00CC99'
    }
    else if (newRead === 'rehu'){
        chartData.value = [10, 10, 10]
        chartBgColor.value = '#FFEE88'
    }
    else if (newRead === 'co2c'){
        chartData.value = [40, 20, 10]
        chartBgColor.value = '#DD1155'
    }
    console.log("chart data current:", bogusData.value.datasets[0].data)
})

</script>