<template>
    <div class="h-64 grid grid-cols-6 my-8">
        <div class="row-span-6 col-span-1 bg-ext-content flex justify-center items-center text-5xl"> C1 <br> 234 </div>
        <div class="relative h-full w-full col-start-2 row-span-6 col-span-3">
            <Line id="chart1" :options="chartOptions" :data="bogusData" :plugins="[backgroundColorPlugin]"/>
        </div>
        <div class="col-start-5 row-span-6 col-span-2 bg-ext-content grid grid-cols-5 place-content-around text-4xl">
            <input type="radio" id="temp" value="temp" name="reading">
            <label class="grid-col" for="temp">T</label>
            <div class="col-span-3 flex justify-end items-center"> 23 &#8451; </div>

            <input type="radio" class="col-start-1 row-start-2" id="rehu" value="rehu" name="reading">
            <label class="col-start-2" for="temp">RH</label>
            <div class="col-span-3 flex justify-end items-center"> 23 % </div>

            <input type="radio" class="col-start-1 row-start-3" id="co2c" value="co2c" name="reading">
            <label class="col-start-2" for="temp">CO2</label>
            <div class="col-span-3 flex justify-end items-end"> 230 ppm </div>

        </div>
    </div>

    <div class="bg-ext-margins h-1 rounded-full w-full mx-auto"></div>
</template>

<script setup lang="ts">

// tree-shakable imports
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

const chartOptions = ref({
    responsive: true,
    maintainAspectRatio: false,
})

const bogusData = ref({
    labels: [ 'January', 'February', 'March' ],
    datasets: [{ 
        data: [40, 20, 12],
        label: 'votes',
        backgroundColor: '#012012'
    }]
})

var chartBgColor: string = '#e9e9e9'

const backgroundColorPlugin = ref({
  id: 'customCanvasBackgroundColor',
  beforeDraw: (chart: any, args: any, options: any) => {
    const {ctx} = chart;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = options.color || chartBgColor;
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
});



</script>