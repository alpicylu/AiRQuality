<template>
    <div class="grid grid-cols-2 h-screen w-screen">
        <div v-for="i in [...Array(numberOfSensors).keys()]">
            <TvElement/>
        </div>
    </div>

</template>

<script setup lang="ts">

const numberOfSensors = ref(4)

definePageMeta({
    layout: false
})

</script>