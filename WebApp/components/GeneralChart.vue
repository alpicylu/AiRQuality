<template>
    <div class="flex flex-row flex-wrap gap-4 my-4 text-2xl h-full">
        <NuxtLink id="room" :to="linkableRoomName" 
            class="flex flex-1 grow-[1] justify-center items-center text-center text-4xl underline hover:bg-ext-primary-1 rounded-l-full"> {{ sensorData?.room }} </NuxtLink>
        <div id="chart" class="flex-1 grow-[7] overflow-hidden h-56">
            <ReactiveChart :data="chartDataC" :times="chartTimeC" :readingType="valueOfRadioGroup"/>
        </div>
        <form id="grid" class="flex-1 grow-[4] grid gap-2 justify-items-center items-center">
            <input type="radio" id="radioT" :value=DisplayType.Temp :name="sensorData?.room" v-model="valueOfRadioGroup" :checked=tempCheck >
            <label id="labelT">T</label>
            <div id="readingT"> {{ tempDisplayable }} &#8451; </div>

            <input type="radio" id="radioRH" :value=DisplayType.Rehu :name="sensorData?.room" v-model="valueOfRadioGroup" :checked="rehuCheck">
            <label id="labelRH">RH</label>
            <div id="readingRH"> {{ sensorData?.rehu.at(-1) }} % </div>

            <input type="radio" id="radioCO2" :value=DisplayType.CO2c :name="sensorData?.room" v-model="valueOfRadioGroup" :checked="co2cCheck">
            <label id="labelCO2">CO2</label>
            <div id="readingCO2"> {{ sensorData?.co2c.at(-1) }} ppm </div>
        </form>
        
    </div> 
</template>

<script setup lang="ts">
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js'
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

import type {SensorDataType, SingleSensorReadingsType} from '~/types/types'
import {DisplayType, SortOptions, ChartHealthStatus} from '~/types/enums'
import {formatDates, getFormatBasedOnDateDiff } from '~/utils/formatDateTimeStrings'

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

const tempDisplayable = computed(() => {
    const temp = props.sensorData?.temp.at(-1)
    if (temp !== undefined){
        return Math.round(temp * 10)/10
    }
    return undefined
})

function displayReadingBasedOnRadio(checkedRadio: DisplayType, data: SingleSensorReadingsType|undefined){
    if (data === undefined) return
    switch (checkedRadio){
        case DisplayType.Temp:
            return data.temp
            
        case DisplayType.Rehu:
            return data.rehu
            
        case DisplayType.CO2c:
            return data.co2c
    }
    // debugger
}


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

const chartDataC = computed(()=>{
    return displayReadingBasedOnRadio(valueOfRadioGroup.value, props.sensorData) ?? Array<number>()
})

/**Rather, it should choose the format based on the difference between oldest and newest reading, but it should also display
 * either the exact date of the first reading or something similar in case data is historical.
 * For instance, if readings were frequent (1read/15min), but that data is a couple weeks old, then it should display readings
 * in hh:mm format, but annotate that this data is from a certain date period.
 * Solution: in such case, display a more 'verbose' reading on the first point (eg. dd.MM.yy) while keeping the rest in the more
 * finely-grained format
 * 
 * Solution 2: Display readings range on chart in case its historical. Display "now" if not.
 */
const chartTimeC = computed(()=>{
    return props.sensorData?.time ? 
        formatDates(props.sensorData.time, getFormatBasedOnDateDiff(props.sensorData.time.at(0), props.sensorData.time.at(-1))) : 
        Array<string>()
})

/**No data is displayed on charts, despite the colors and y-axis updating, because without this watcher firing
 * chartTime and chartData remain unchanged - empty arrays.
 */

const dateRangeToDisplay = computed(()=>{
    const dateA = props.sensorData?.time.at(0)
    const dateB = new Date().toISOString()
    if (!dateA || !dateB) return ''
    else if (calcDateDiff(dateA, dateB) <=1) return 'Today'
    else {
        const [dateAFormatted, dateBformatted] = formatDates([dateA, props.sensorData?.time.at(-1)!], 'dd.MM.yy')
        return `${dateAFormatted} - ${dateBformatted}` 
    }
})
/**ToDo:
 * will the below provide() remain reactive? Will it update itself when data changes?
 */
provide('displayTitle', true)
provide('dateRange', dateRangeToDisplay.value)

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

#grid>#radioT {
    grid-area: radioT;
}
#grid>#labelT {
    grid-area: labelT;
}
#grid>#readingT {
    grid-area: readingT;
}

#grid>#radioRH {
    grid-area: radioRH;
}
#grid>#labelRH {
    grid-area: labelRH;
}
#grid>#readingRH {
    grid-area: readingRH;
}

#grid>#radioCO2 {
    grid-area: radioCO2;
}
#grid>#labelCO2 {
    grid-area: labelCO2;
}
#grid>#readingCO2 {
    grid-area: readingCO2;
}
/* Setting a constant height to the */
/* Try the relative approach again, but remove height: 12rem */
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