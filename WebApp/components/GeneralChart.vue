<template>
    <NuxtLink id="room" :to="linkableRoomName" class="flex flex-1 grow-[1] justify-center items-center text-4xl"> {{ sensorData?.room }} </NuxtLink>
    <div id="chart" class="flex-1 grow-[7] relative overflow-hidden">
        <Line id="chart" :options="chartReactiveOptions" :data="chartReactiveData" :plugins="[backgroundColorPlugin]"/>
    </div>
    <form id="grid" class="flex-1 grow-[4] grid gap-2 justify-items-center items-center">
        <input type="radio" :id="sensorData?.room + 'T'" :value=DisplayType.Temp :name="sensorData?.room" v-model="valueOfRadioGroup" :checked=tempCheck>
        <label :for="sensorData?.room + 'T'">T</label>
        <div > {{ tempDisplayable }} &#8451; </div>

        <input type="radio" :id="sensorData?.room + 'R'" :value=DisplayType.Rehu :name="sensorData?.room" v-model="valueOfRadioGroup" :checked="rehuCheck">
        <label :for="sensorData?.room + 'R'">RH</label>
        <div > {{ sensorData?.rehu.at(-1) }} % </div>

        <input type="radio" :id="sensorData?.room + 'C'" :value=DisplayType.CO2c :name="sensorData?.room" v-model="valueOfRadioGroup" :checked="co2cCheck">
        <label :for="sensorData?.room + 'C'">CO2</label>
        <div > {{ sensorData?.co2c.at(-1) }} ppm </div>
    </form>
</template>

<!-- <template>
    <div class="h-64 grid grid-cols-6 my-8">
        <NuxtLink :to="linkableRoomName" class="row-span-6 col-span-1 bg-ext-content flex justify-start items-center text-5xl"> {{ sensorData?.room }} </NuxtLink>
        <div class="relative h-full w-full col-start-2 row-span-6 col-span-3">
            <Line id="chart1" :options="chartReactiveOptions" :data="chartReactiveData" :plugins="[backgroundColorPlugin]"/>
        </div>
        <form class="col-start-5 row-span-6 col-span-2 bg-ext-content grid grid-cols-5 place-content-around text-4xl">
            <input type="radio" class="col-start-1 row-start-1" :id="sensorData?.room + 'T'" :value=DisplayType.Temp :name="sensorData?.room" v-model="valueOfRadioGroup" :checked=tempCheck>
            <label class="grid-col" :for="sensorData?.room + 'T'">T</label>
            <div class="col-span-3 flex justify-end items-center"> {{ tempDisplayable }} &#8451; </div>

            <input type="radio" class="col-start-1 row-start-2" :id="sensorData?.room + 'R'" :value=DisplayType.Rehu :name="sensorData?.room" v-model="valueOfRadioGroup" :checked="rehuCheck">
            <label class="col-start-2" :for="sensorData?.room + 'R'">RH</label>
            <div class="col-span-3 flex justify-end items-center"> {{ sensorData?.rehu.at(-1) }} % </div>

            <input type="radio" class="col-start-1 row-start-3" :id="sensorData?.room + 'C'" :value=DisplayType.CO2c :name="sensorData?.room" v-model="valueOfRadioGroup" :checked="co2cCheck">
            <label class="col-start-2" :for="sensorData?.room + 'C'">CO2</label>
            <div class="col-span-3 flex justify-end items-end"> {{ sensorData?.co2c.at(-1) }} ppm </div>
        </form>
    </div>
    <div class="bg-ext-margins h-1 rounded-full w-full mx-auto"></div>
</template> -->

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

import type {SensorDataType, SingleSensorReadingsType} from '~/types/types'
import {DisplayType, SortOptions, ChartHealthStatus} from '~/types/enums'
import {formatDatesToHourMinute} from '~/utils/formatDateTimeStrings'

const props = defineProps<{
    checkAllRadios: DisplayType
    sensorData?: SingleSensorReadingsType
}>()

onMounted(() => {
    tempCheck.value = true
})

const valueOfRadioGroup = ref<DisplayType>(props.checkAllRadios)

const linkableRoomName = computed(() => `/sensors/${props.sensorData?.room.replace(/\s/g, "_")}`)

const tempCheck = ref(false)
const rehuCheck = ref(false)
const co2cCheck = ref(false)

const chartData = ref<number[]>([])
const chartTime = ref<string[]>([])

const {bgColor, updateBgColor} = useDynamicChartBgColor()

const chartReactiveOptions = computed(() => {
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

const chartReactiveData = computed(() => {
    return {
        labels: chartTime.value, //if labels are undefined, the chart just wont display data (good)
        datasets: [{
            data: chartData.value,
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
            ctx.fillStyle = options.color || bgColor.value;
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    }
});

const tempDisplayable = computed(() => {
    const temp = props.sensorData?.temp.at(-1)
    if (temp !== undefined){
        return Math.round(temp * 10)/10
    }
    return undefined
})

function displayReadingBasedOnRadio(){
    if (props.sensorData === undefined) return
    switch (valueOfRadioGroup.value){
        case DisplayType.Temp:
            chartData.value = props.sensorData.temp
            break
        case DisplayType.Rehu:
            chartData.value = props.sensorData.rehu
            break
        case DisplayType.CO2c:
            chartData.value = props.sensorData.co2c
            break
    }
}

//Change layout once window width is at most 750px (same condition as the media query)

/*Just make a media query in the layout .vue file */

watch(() => props.checkAllRadios, (newCheck, oldCheck) => {
    switch (newCheck){
        case DisplayType.Temp:
            rehuCheck.value = co2cCheck.value = false
            tempCheck.value = true
            valueOfRadioGroup.value = newCheck
            break
        case DisplayType.Rehu:
            tempCheck.value = co2cCheck.value = false
            rehuCheck.value = true
            valueOfRadioGroup.value = newCheck
            break
        case DisplayType.CO2c:
            rehuCheck.value = tempCheck.value = false
            co2cCheck.value = true
            valueOfRadioGroup.value = newCheck
            break
    }
})

watch(() => valueOfRadioGroup.value, (newVal, oldVal) => {
    displayReadingBasedOnRadio()
    updateBgColor(chartData.value.at(-1), valueOfRadioGroup.value)
})

watch(() => props.sensorData, (newData, oldData) => {
    console.log("Charts received new data")
    displayReadingBasedOnRadio()
    updateBgColor(chartData.value.at(-1), valueOfRadioGroup.value)
    if (newData !== undefined) chartTime.value = formatDatesToHourMinute(newData.time)
}, {deep: true})



</script>

<style>

input {
    width: 3rem;
    height: 3rem;
}

#grid {
    grid-template-areas: 
        'radioT   labelT   readingT'
        'radioRH  labelRH  readingRH'
        'radioCO2 labelCO2 readingCO2';
}

#grid>input:nth-of-type(1){
    grid-area: radioT;
}

#grid>label:nth-of-type(1){
    grid-area: labelT;
}

#grid>div:nth-of-type(1){
    grid-area: readingT;
}

#grid>input:nth-of-type(2){
    grid-area: radioRH;
}

#grid>label:nth-of-type(2){
    grid-area: labelRH;
}

#grid>div:nth-of-type(2){
    grid-area: readingRH;
}

#grid>input:nth-of-type(3){
    grid-area: radioCO2;
}

#grid>label:nth-of-type(3){
    grid-area: labelCO2;
}

#grid>div:nth-of-type(3){
    grid-area: readingCO2;
}

@media (max-width: 750px){
    #chart {
        flex: 1 1 500px;
        height: 12rem;
    }
    #room {
        flex: 1 1 500px;
        font-size: 1.25rem/* 24px */;
        line-height: 0.25rem/* 32px */;
    }
    #grid {
        flex: 1 1 500px;
        grid-template-areas:  
            'radioT labelT radioRH labelRH radioCO2 labelCO2'
            'readingT readingT readingRH readingRH readingCO2 readingCO2';
        font-size: 1rem/* 24px */;
        line-height: 1.5rem/* 32px */;
        min-width: 0;
    }
    input {
        width: 1.25rem;
        height: 1.25rem;
    }
}

</style>