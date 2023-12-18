<template>
    <div class="flex flex-initial flex-wrap justify-end items-center bg-ext-margins rounded-full w-10/12 my-10 px-10 py-2">
        <DropDownList name="Display" :options="displayOptions" v-model:selectedOption="displayValue"/>
        <DropDownList name="Sort By" :options="sortOptions" v-model:selectedOption="sortValue"/>
    </div>

    <div class="flex flex-col flex-auto min-h-0 w-5/6 justify-start items-center">
        <ul class="overflow-y-auto overflow-hidden h-fit w-full">
            <li v-for="i in iqrfIdSensorList.length" :key="i" > <GeneralChart
                :checkAllRadios="displayValue" :sensorData="fetchedSensorData[i-1]" /> </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import type {SensorDataType, SingleSensorReadingsType} from '~/types/types'
import {DisplayType, SortOptions} from '~/types/enums'
import {msClientServerPollDelay} from '~/constants/constants'

onMounted(() => {
    getFirstBatchSensorData().catch(console.error)
})

const iqrfIdSensorList = ref<string[]>([])
const fetchedSensorData = ref<SingleSensorReadingsType[]>([])
const nDataPointsOnChart = ref<number>(24)
//cursor can be undefined when the fetch succeeded, but the sensor simply hadnt returned any readings (empty arrays)
const cursorToSensorMap = ref(new Map())

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

async function getFirstBatchSensorData(){
    const sensors = await useFetch("/api/sensors")
        .then(res => res.data.value?.sensors)

    if (sensors === undefined || sensors === null)
        throw new Error("Error fetching a list of available sensors. Possibly, the fetch failed to get any data (fetched null)")

    //get a list of registered sensors from the DB
    // let iqrfIdSensorList: string[] = []
    sensors.forEach(el => {
        iqrfIdSensorList.value.push(el.iqrfId)
    })

    let sensorReadingsObjectList: SingleSensorReadingsType[] = []
    await Promise.all(
        iqrfIdSensorList.value.map((iqrfid) => useFetch<SingleSensorReadingsType>(`/api/sensors/${iqrfid}/readings?take=${nDataPointsOnChart.value}&order=desc`))
    ).then(res => {
        res.forEach(el => { //each promise resolved with a value - iterate over those resolves
            const sensorData = el.data.value
            if (sensorData == null) return //if a sensor's data is null, skip to the next iteration
            sensorReadingsObjectList.push(sensorData)
            cursorToSensorMap.value.set(sensorData.iqrfId, sensorData.id.at(0))
        })
    }).catch(console.error)

    if (sensorReadingsObjectList.length !== iqrfIdSensorList.value.length) {
        throw new Error("Number of sensors that provided data is not equal to the amount of registered sensors")
    }

    //descending sort order returns newest records, but in reverse chrono order - reverse the arrays for chronological readings
    sensorReadingsObjectList.forEach(sensor => {
        sensor.id.reverse()
        sensor.time.reverse()
        sensor.temp.reverse()
        sensor.rehu.reverse()
        sensor.co2c.reverse()
    })

    fetchedSensorData.value = sensorReadingsObjectList

    console.log(fetchedSensorData.value)
}

async function pollServerForNewReadings(){

    //here, i shall abuse the fact that The fulfillment value is an array of fulfilled promises, 
    //in the order of the promises passed, regardless of completion order
    //The order of readings fetched here and the initial fetch from getFirstBatch... is coordinated by 2 things:
    //1. the iqrfIdSensorList array, which is populated in getFirstBatch and stays unchanged after that
    //2. Promise.all returns fulfillment values in the same order that the promises inside of it were passed.
    //The order of sensors here and in the fetchedSensorData array is the same.
    //And i know the promises will be created in the same order because in both cases they are created from the iqrfSensorList arr.
    let newReadings: (SingleSensorReadingsType|null)[] = []
    await Promise.all(
        iqrfIdSensorList.value.map((iqrf) => {
            const sensorCurrentCursor = cursorToSensorMap.value.get(iqrf)
            return useFetch(`/api/sensors/${iqrf}/readings?take=${nDataPointsOnChart.value}&order=asc&cursor=${sensorCurrentCursor}`)
        })
    ).then(res => {
        res.forEach(el => {
            //we will push null from sensors that for some reasons didnt fetch
            //to keep the sensors from newReadings and fetchedSensorData in the same order (and the arrs themselves in length)
            const sensorData = el.data.value
            newReadings.push(sensorData)
            if (sensorData !== null && sensorData.id.length > 0) cursorToSensorMap.value.set(sensorData.iqrfId, sensorData.id.at(0))
        })
    }).catch(console.error)

    console.log("Index fetched for new readings:")
    console.log(newReadings)

    //If at least 1 sensor returned any data, the function will continue
    let totalNewReadings = 0
    newReadings.forEach(el => {
        if (el !== null) totalNewReadings += el.id.length
    })
    if (totalNewReadings === 0){
        console.log("No new batches")
        return
    }

    //dont update readings from sensors that fetched null
    //the i index represents individual sensors (SingleSensorReadingsType objects)
    for (let i=0; i<newReadings.length; ++i){
        if (newReadings[i] === null) continue   //dunno why i need to coerce the null here
        fetchedSensorData.value[i].id = fetchedSensorData.value[i].id.concat(newReadings[i]!.id)
        fetchedSensorData.value[i].time = fetchedSensorData.value[i].time.concat(newReadings[i]!.time)
        fetchedSensorData.value[i].temp = fetchedSensorData.value[i].temp.concat(newReadings[i]!.temp)
        fetchedSensorData.value[i].rehu = fetchedSensorData.value[i].rehu.concat(newReadings[i]!.rehu)
        fetchedSensorData.value[i].co2c = fetchedSensorData.value[i].co2c.concat(newReadings[i]!.co2c)

        if (fetchedSensorData.value[i].id.length > nDataPointsOnChart.value){
            const nOldRecordsToRemove = newReadings[i]!.id.length
            fetchedSensorData.value[i].id = fetchedSensorData.value[i].id.slice(nOldRecordsToRemove)
            fetchedSensorData.value[i].time = fetchedSensorData.value[i].time.slice(nOldRecordsToRemove)
            fetchedSensorData.value[i].temp = fetchedSensorData.value[i].temp.slice(nOldRecordsToRemove)
            fetchedSensorData.value[i].rehu = fetchedSensorData.value[i].rehu.slice(nOldRecordsToRemove)
            fetchedSensorData.value[i].co2c = fetchedSensorData.value[i].co2c.slice(nOldRecordsToRemove)
        }
    }
}

const pollingInterval = setInterval(() => {
    pollServerForNewReadings()
}, msClientServerPollDelay)


</script>