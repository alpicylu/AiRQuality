<template>
    <div class="flex flex-initial flex-wrap justify-end items-center bg-ext-margins rounded-full w-10/12 my-10 px-10 py-2">
        <DropDownList name="Display" :options="displayOptions" v-model:selectedOption="displayValue"/>
        <DropDownList name="Sort By" :options="sortOptions" v-model:selectedOption="sortValue"/>
    </div>

    <div class="flex flex-col flex-auto min-h-0 w-5/6 justify-start items-center">
        <ul class="overflow-y-auto overflow-hidden h-fit w-full">
            <li v-for="(r, i) in roomList"> <GeneralChart
                :room="r" :checkAllRadios="displayValue" :sensorData="fetchedSensorData.slice(i*10, i*10+10)" /> </li>
        </ul>
    </div>
    <!-- <div class="text-xl">{{ testFetch[0].ti }}</div> -->
</template>

<script setup lang="ts">
import {DisplayType, SortOptions, sensorDataType} from '../types/types'


function roomSort(rooms: string[], sortFun: (a: string, b: string) => number){//this function sorts the list IN PLACE
    //use a map function to create a temporary list, whose strings have no spaces
    //(i dont need to remove spaces)
    //then sort the items of that list alphabetically.
    // const tempArr: string[] = rooms.map((room: string) => {
    //     return room.replace(/\s+/g, '')
    // })
    rooms.sort(sortFun)
}
//defined defaultSort solely because i want the rooms to be sorted on first render and i dont want
//to repeat 3 lines of code.
function defaultSort(a: string, b: string): number {
    if (a < b) return -1
    if (a > b) return 1
    return 0
}

//TODO change those into enums, same thing in Generalchart.
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
var roomList = ref(["C1 234", "C1 011", "C1 201", "C2 101", "C2 201"].sort(defaultSort))

const fetchedSensorData = ref<sensorDataType[]>(Array(50).fill({
    time: '0',
    temp: 0,
    rehu: 0,
    co2c: 0,
    id: 0
}))//prepopulate with an array (described in todo)
async function getSensorData(sensorID: number) {
    const { data } = await useFetch<sensorDataType[]>('/api/sensors')
    if (data.value !== null){
        fetchedSensorData.value = data.value
    }
}

watch(sortValue, (newSort, oldSort) => {
    if (newSort === SortOptions.Rasc) {
        roomSort(roomList.value, defaultSort)
    }
    else if (newSort === SortOptions.Rdes) {
        roomSort(roomList.value, (a: string, b: string): number => {
            if (a < b) return 1
            if (a > b) return -1
            return 0
        })
    }
})

getSensorData(0)

/* TODO
I want the graphs to load AFTER the server fetched the data. Make all the necessary fetches with the onBeforeMounted lifehook


I need to make sure that fetchedSensorData is not undefined, because Vue/JS do not like working with undefined values
give fSD an initial 0-ed value - a list of objects, all of which have their properties set to 0.
Remember that this is only a mockup, in reality i will be fetching, distributing and displaying data a little differently
but at the very least its a good exercise.

As a bonus, passing all-0 values, rendering a chart, passing actual values and then refreshing charts will have a pretty nice effect
a flat line will bounce and form itself into nice looking data.


refactor your code - first imports, then lifehooks, then refs, then funs, then the rest.
*/

</script>