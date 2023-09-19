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

//make those into enums
const displayOptions = ref([
    "Temperature",
    "Rel. Humidity",
    "CO2 Content",
])
const sortOptions = ref([
    "Room Ascending",
    "Room Descending",
    "Best First",
    "Worst First"
])
const displayValue = ref(displayOptions.value[0].toLowerCase());
const sortValue = ref(sortOptions.value[0].toLowerCase());


const roomList: string[] = ["C1 234", "C1 011", "C1 201", "C2 101", "C2 201"]


</script>