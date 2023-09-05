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
            <div class="flex justify-end gap-x-5 bg-gray-300 rounded-full w-10/12 h-12 mx-auto my-10">
                <DropDownList :name="ddName" :options="dropElems"/>
            </div>
        </body>    
    </div>
    </div>
</template>

<script setup>

const ddName = "Display";

const dropElems = ref([
    "Option 1",
    "Option 2",
    "Option 3",
])

</script>