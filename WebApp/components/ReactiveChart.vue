<template>
    <Line :data="chartReactiveData" :options="chartReactiveOptions" :plugins="[backgroundColorPluginChart]"/>
</template>


<script setup lang="ts">
import { DisplayType } from '~/types/enums';
import { Chart, Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

const props = defineProps<{
    data: number[]; //the y-axis part of a datapoint (reading value)
    times: string[]; //the x-axis part of a datapoint (datetime)
    readingType: DisplayType;
}>()

const {bgColor: chartBgColor, updateBgColor: chartBgColorUpdate} = useDynamicChartBgColor()

const chartReactiveData = computed(()=> {
    return {
        labels: props.times, 
        datasets: [{
            data: props.data,
            tension: 0.4,
            borderColor: '#000000',
            color: '#000000',
            fontColor: '#000000',
        }]
    }
})

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

const backgroundColorPluginChart = computed(() => {
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

watch(() => props.data, (newReadings, oldReadings) => {
    console.log("Color watcher ran")
    chartBgColorUpdate(newReadings.at(-1), props.readingType)
}, {deep: true, immediate: true})

</script>