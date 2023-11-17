<template>
    <div class="flex flex-initial flex-wrap justify-end items-center bg-ext-margins rounded-full w-10/12 my-10 px-10 py-2">
        <DropDownList name="Display" :options="displayOptions" v-model:selectedOption="displayValue"/>
        <DropDownList name="Sort By" :options="sortOptions" v-model:selectedOption="sortValue"/>
    </div>

    <div class="flex flex-col flex-auto min-h-0 w-5/6 justify-start items-center">
        <ul class="overflow-y-auto overflow-hidden h-fit w-full">
            <li v-for="r in roomList" :key="r.roomIndex" > <GeneralChart
                :room="r.roomName" :checkAllRadios="displayValue" :sensorData="fetchedSensorData.slice(r.roomIndex*10, r.roomIndex*10+10)" /> </li>
        </ul>
    </div>
</template>
 
<script setup lang="ts">
import { DisplayType, SortOptions } from '../types/types'
import type { SensorDataType } from '../types/types'

interface RoomObject {
    roomName: string,
    roomIndex: number
}

//the room index does not serve re-ordering the list. Rather, it simply defines which portion of the fetched data
//will be assigned to the GeneralChart component. The actuall reordering is done by changing the order of the room objects in this list
//roomIndex serves just to connect the room with its data.
var roomList = ref<RoomObject[]>([
    {roomName: "C1 234", roomIndex: 0},
    {roomName: "C1 011", roomIndex: 1},
    {roomName: "C1 201", roomIndex: 2},
    {roomName: "C2 101", roomIndex: 3},
    {roomName: "C2 201", roomIndex: 4}
].sort(defaultSort))
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

const fetchedSensorData = ref<SensorDataType[]>(Array(50).fill({
    time: '0',
    temp: 0,
    rehu: 0,
    co2c: 0,
    id: 0
}))//prepopulate with an array. If initial value is not provided to ref() then it defaults to undefined
//which makes Vue and JS confused sometimes

//defined defaultSort solely because i want the rooms to be sorted on first render and i dont want
//to repeat 3 lines of code.
function defaultSort(a: RoomObject, b: RoomObject): number {
    if (a.roomName < b.roomName) return -1
    if (a.roomName > b.roomName) return 1
    return 0
} 

//make a call to the internal API for the data. Make sure the data is not null or undef
async function getSensorData() {
    const {data, error, status} = await useFetch<SensorDataType[]>('/api/sensors')
    if (data.value !== null){
        fetchedSensorData.value = data.value
        console.log(data.value.at(0))
    }
}

//Whenever the sort dropdown list changes its value i want to reorder the chart components
watch(sortValue, (newSort, oldSort) => {
    if (newSort === SortOptions.Rasc) {
        roomList.value.sort(defaultSort)
    }
    else if (newSort === SortOptions.Rdes) {
        roomList.value.sort((a: RoomObject, b: RoomObject): number => {
            if (a.roomName < b.roomName) return 1
            if (a.roomName > b.roomName) return -1
            return 0
        })
    }
})


if (process.client) {
    console.log("I ran in client")
    getSensorData()
}



/* TODO
I want the graphs to load AFTER the server fetched the data. Make all the necessary fetches with the onBeforeMounted lifehook
*/


</script>