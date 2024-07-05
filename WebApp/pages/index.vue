<template>
    <div class="flex flex-col h-full items-center">
        <div class="w-5/6 sticky top-0 z-10 bg-ext-white">
            <div class="flex flex-initial flex-wrap justify-end items-center bg-ext-primary-1 rounded-full w-full my-5 px-10 py-2">
                <DropDownList is="drop-display" name="Display" :options="displayOptions" v-model:selectedOption="displayValue"/>
                <DropDownList is="drop-display" name="Sort by" :options="sortOptions" v-model:selectedOption="sortValue"/>
            </div>
        </div>
        <ul class="flex flex-col w-5/6" data-test="charts">
            <li v-for="i in iqrfIdSensorList.length" :key="i" > 
                <GeneralChart :checkAllRadios="displayValue" :sensorData="sortedArrayOfReadings[i-1]" /> 
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import type {SensorDataType, SingleSensorReadingsType} from '~/types/types'
import {DisplayType, SortOptions} from '~/types/enums'
import {msClientServerPollDelay} from '~/constants/constants'
import fakeLiveFeed from '~/tests/fakeSensorLiveFeed'

const nDataPointsOnChart = ref<number>(24)

const displayOptions = ref([
    DisplayType.Temp,
    DisplayType.Rehu,
    DisplayType.CO2c,
])
const sortOptions = ref([
    SortOptions.ReadingAsc,
    SortOptions.ReadingDesc
])
const displayValue = ref(displayOptions.value[0]);
const sortValue = ref(sortOptions.value[0]);

//reading arrays can be empty, check for that, this is TEMPORARY
//use switch() to determine sort order and type
//you could also just make sortedReadings a ref and pass it into the component. Just make sure reactivity is maintanied.

const sortedArrayOfReadings = computed(()=>{ 
    let tempArr = fetchedSensorData.value
    const order: number = (sortValue.value === SortOptions.ReadingAsc ? -1 : 1)
    
    //reading type to sort by
    switch (displayValue.value){
        case DisplayType.Temp:
            tempArr.sort((a, b) => -order * a.temp.at(-1)! + order * b.temp.at(-1)!)
            console.log("switch trigerred, ord: ", order)
            break 
        case DisplayType.Rehu:
            tempArr.sort((a, b) => -order * a.rehu.at(-1)! + order * b.rehu.at(-1)!)
            break
        case DisplayType.CO2c:
            tempArr.sort((a, b) => -order * a.co2c.at(-1)! + order * b.co2c.at(-1)!)
            break
    }
    // debugger
    return tempArr
})

const {iqrfIdSensorList, fetchedSensorData, getFirstBatchSensorData, pollServerForNewReadings} = useGetSensorData()
getFirstBatchSensorData(nDataPointsOnChart.value).catch(console.error)
const pollingInterval = setInterval(() => {
    pollServerForNewReadings(nDataPointsOnChart.value)
}, msClientServerPollDelay)

// const testReadings = ref<SingleSensorReadingsType[]>([])
// const {fetchedSensorData, iqrfIdSensorList, getFirstBatchSensorData, pollServerForNewReadings} = fakeLiveFeed(4)
// getFirstBatchSensorData()
// const pollingInterval = setInterval(() => {
//     pollServerForNewReadings(nDataPointsOnChart.value)
// }, 1000*30)

</script>
