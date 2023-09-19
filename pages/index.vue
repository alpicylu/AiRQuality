<template>
    <div class="flex flex-initial flex-wrap justify-end items-center bg-ext-margins rounded-full w-10/12 my-10 px-10 py-2">
        <DropDownList name="Display" :options="displayOptions" v-model:selectedOption="displayValue"/>
        <DropDownList name="Sort By" :options="sortOptions" v-model:selectedOption="sortValue"/>
    </div>

    <div class="flex flex-col flex-auto min-h-0 w-5/6 justify-start items-center">
        <ul class="overflow-y-auto overflow-hidden h-fit w-full">
            <li v-for="r in roomList"> <GeneralChart :room="r" :checkAllRadios="displayValue" /> </li>
        </ul>
    </div>
    <!-- <div class="text-xl">{{ displayValue }}</div> -->
</template>

<script setup lang="ts">
import {DisplayType, SortOptions} from '../enums/enum'

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
    SortOptions.Bfir,
    SortOptions.Wfir,
])
const displayValue = ref(displayOptions.value[0]);
const sortValue = ref(sortOptions.value[0]);

var roomList = ref(["C1 234", "C1 011", "C1 201", "C2 101", "C2 201"].sort(defaultSort))


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





</script>