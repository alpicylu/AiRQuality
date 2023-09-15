<template>
    <!-- <div class="flex flex-col flex-auto"> this is the one that overflows? - yea -->
        <div class="flex flex-initial flex-wrap justify-end items-center bg-ext-margins rounded-full w-10/12 mx-auto my-10 px-10 py-2">
            <DropDownList name="Display" :options="displayOptions" v-model:selectedOption="displayValue"/>
            <DropDownList name="Sort By" :options="sortOptions" v-model:selectedOption="sortValue"/>
        </div>

        <div class="flex flex-col flex-auto min-h-0 justify-start items-center">
            <ul class="overflow-y-auto overflow-hidden h-5/6 text-8xl">
                <li>List element 1</li>
                <li>List element 2</li>
                <li>List element 3</li>
                <li>List element 4</li>
                <li>List element 5</li>
                <li>List element 6</li>
                <li>List element 7</li>
                <li>List element 8</li>
                <li>List element 9</li>
            </ul>
        </div>

    <!-- </div> -->
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