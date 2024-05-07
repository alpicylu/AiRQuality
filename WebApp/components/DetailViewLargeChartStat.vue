<template>

<div class="grid grid-cols-9 grid-rows-3 relative">
    <h1 class="row-start-1 col-start-1 row-span-2 col-span-1 px-1 text-right break-words hyphens-manual" >{{ addHardHyphens }}</h1>
    <h2 class="row-start-3 col-start-1 row-span-1 col-span-1 px-1 absolute bottom-0 right-0" >{{ unitFromReadingType }}</h2>
    <div class="row-start-1 col-start-2 row-span-3 col-span-4 relative">
        <ReactiveChart class="absolute top-0 left-0 right-0 bottom-0" :data="props.data" :times="props.times" :readingType="props.readingType"/>
    </div>
    <div id="data-row" class="row-start-2 col-start-6 row-span-1 col-span-4 flex justify-around items-center">
        <p>{{ tableRowData.now }}</p>
        <p>{{ tableRowData.max }}</p>
        <p>{{ tableRowData.min }}</p>
        <p>{{ tableRowData.avg }}</p>
    </div>
</div>

</template>
<!-- that absolute 0000 on ReactiveChart fixes a resizing issue where the canvas would grow, but would not shrink back on screen resize -->

<script setup lang="ts">
import { DisplayType } from '~/types/enums';

const props = defineProps<{
    data: number[];
    times: string[];
    readingType: DisplayType;
}>()

const tableRowData = computed(() => {
    if (!props.data?.length) return {
        now: 0,
        max: 0,
        min: 0,
        avg: 0
    }
    return {
        now: roundToOneTenth( props.data?.at(-1) ),
        max: roundToOneTenth(Math.max(...props.data)),
        min: roundToOneTenth(Math.min(...props.data)),
        avg: roundToOneTenth( props.data.reduce((acc, val) => acc+val, 0) / props.data.length )
    }
})

function roundToOneTenth(val: number | undefined){
    if (val === undefined) return NaN
    return Math.round(val * 10)/10
}

const unitFromReadingType = computed(() => {
    switch (props.readingType){
        case DisplayType.Temp: return '\u2103'
        case DisplayType.Rehu: return '%'
        case DisplayType.CO2c: return 'ppm'
    }
})

/*This is a bit silly.
CSS wont hyphenate the word unless i set explicit hyphen-spots
Doing elipses and cutting the text is ugly, so is wrapping it without hyphens. */
const addHardHyphens = computed(() => {
    switch (props.readingType){
        case DisplayType.Temp:
            return "Temper\u00ADature"
        case DisplayType.Rehu:
            return "Rel. hu\u00ADmidity"
        case DisplayType.CO2c:
            return "CO2 con\u00ADtent"
    }
})
</script>


<style>

</style>