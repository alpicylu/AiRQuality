<template>
    <div class="flex flex-initial flex-wrap justify-end items-center bg-ext-margins rounded-full w-10/12 my-10 px-10 py-2">
        <DropDownList name="Display" :options="displayOptions" v-model:selectedOption="displayValue"/>
        <DropDownList name="Sort By" :options="sortOptions" v-model:selectedOption="sortValue"/>
    </div>

    <div class="flex flex-col flex-auto min-h-0 w-5/6 justify-start items-center">
        <ul class="overflow-y-auto overflow-hidden h-fit w-full">
            <li><GeneralChart/></li>
            <li><GeneralChart/></li>
            <li><GeneralChart/></li>
            <li><GeneralChart/></li>
            <li><GeneralChart/></li>
            <li><GeneralChart/></li>
        </ul>
    </div>
</template>

<script setup>

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

const displayValue = ref("");
const sortValue = ref("");

</script>