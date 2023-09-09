<template>
    <div class="w-screen h-screen flex flex-row justify-around bg-gray-200">
    <div class="w-5/6 bg-gray-50">
        <header>
            <nav>
            <div class="flex justify-evenly items-start mt-2">
                <NuxtLink to="/">Home</NuxtLink>
                <NuxtLink>Settings</NuxtLink>
                <NuxtLink>Log In</NuxtLink>
                <NuxtLink>Help</NuxtLink>
                <NuxtLink>About</NuxtLink>
            </div>
            </nav>
        </header>
        <body>
            <div class="flex flex-row justify-end items-center gap-x-5 bg-gray-300 rounded-full w-10/12 h-12 mx-auto my-10 px-10">
                <DropDownList name="Display" :options="displayOptions" v-model:selectedOption="displayValue"/>
                <DropDownList name="Sort By" :options="sortOptions" v-model:selectedOption="sortValue"/>
            </div>
            <div class="bg-red-300">
                Test: {{ displayValue }} {{ sortValue }}
            </div>
        </body>    
    </div>
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