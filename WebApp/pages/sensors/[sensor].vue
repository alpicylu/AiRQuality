<template>

    <div class="flex flex-initial justify-evenly h-full w-full">

        <div class="basis-1/2 flex flex-col flex-auto justify-between gap-4 min-w-0 bg-red-200">

            <div class="basis-1/12 flex justify-center items-center">SALA</div>

            <div class="w-full"><Line :data="chartReactiveData" :options="chartReactiveOptions"/></div>

            <!-- <div class="basis-3/12 flex flex-initial justify-center items-center">
                <h1>Temperature</h1>
                <div><Line :data="chartReactiveData" :options="chartReactiveOptions"/></div>
            </div>

            <div class="basis-3/12 flex flex-initial justify-center items-center">
                <h1>Temperature</h1>
                <div><Line :data="chartReactiveData" :options="chartReactiveOptions"/></div>
            </div> -->


            <div class="basis-1/12 flex justify-around items-center">
                <button>DATE A</button>
                <button>DATE B</button>
            </div>

        </div>

        <div class="basis-1/2 flex flex-col flex-auto justify-between bg-green-200">
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
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

const chartOptions = ref({})
const chartData = ref()

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

const chartReactiveData = computed(()=> {
    return {
        labels: [0,1,2,3,4], //if labels are undefined, the chart just wont display data (good)
        datasets: [{
            data: [0,1,2,3,4],
            tension: 0.4,
            borderColor: '#000000',
            color: '#000000',
            fontColor: '#000000'
        }]
    }
})


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