<template>
    <div class="flex flex-col h-full items-center">
        <div class="w-5/6 sticky top-0 z-10 bg-ext-white">
            <div class="flex flex-initial flex-wrap justify-end items-center bg-ext-primary-1 rounded-full w-full my-5 px-10 py-2">
                <DropDownList is="drop-display" name="Display" :options="displayOptions" v-model:selectedOption="displayValue"/>
            </div>
        </div>
        <ul class="flex flex-col w-5/6">
            <li v-for="i in iqrfIdSensorList.length" :key="i" > 
                <GeneralChart :checkAllRadios="displayValue" :sensorData="fetchedSensorData[i-1]" /> 
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import type {SensorDataType, SingleSensorReadingsType} from '~/types/types'
import {DisplayType, SortOptions} from '~/types/enums'
import {msClientServerPollDelay} from '~/constants/constants'

onMounted(()=>{
    /**Calling this func at onMounted hook  */
    
})

const nDataPointsOnChart = ref<number>(24)

const displayOptions = ref([
    DisplayType.Temp,
    DisplayType.Rehu,
    DisplayType.CO2c,
])
const sortOptions = ref([
    SortOptions.Rasc,
    SortOptions.Rdes,
    SortOptions.Tasc,
    SortOptions.Tdes,
])
const displayValue = ref(displayOptions.value[0]);
const sortValue = ref(sortOptions.value[0]);

const {iqrfIdSensorList, fetchedSensorData, getFirstBatchSensorData, pollServerForNewReadings} = useGetSensorData()
getFirstBatchSensorData(nDataPointsOnChart.value).catch(console.error)

const pollingInterval = setInterval(() => {
    pollServerForNewReadings(nDataPointsOnChart.value)
}, msClientServerPollDelay)


</script>
