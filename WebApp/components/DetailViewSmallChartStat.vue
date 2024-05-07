<template>

    <div>
        <div class="flex flex-auto justify-between">
            <h2>{{ props.readingType }}</h2>
            <div>{{ unitFromReadingType }}</div>
        </div>
        <div class="w-full h-40 "><ReactiveChart :data="props.data" :times="props.times" :readingType="props.readingType"/></div>
        <table class="w-full">
            <thead>
                <tr>
                    <th>Now</th>
                    <th>Max</th>
                    <th>Min</th>
                    <th>Avg</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{{ tableRowData.now }}</td>
                    <td>{{ tableRowData.max }}</td>
                    <td>{{ tableRowData.min }}</td>
                    <td>{{ tableRowData.avg }}</td>
                </tr>
            </tbody>
        </table>
    </div>

</template>

<script setup lang="ts">
import { DisplayType } from '~/types/enums';

//We need N props for this element
//  Array of data for the chart to display and the row to calculate stats on
//  Array of time-points to plot the data
//  Type of reading - Rehu/Temp/CO2c
const props = defineProps<{
    data: number[];
    times: string[];
    readingType: DisplayType;
}>()

/*Can i make this a composable? */
const tableRowData = computed(() => {
    //apparently, for a single tick props.data is not an array (or at least it does not have the length property)
    //just going "!props.data.length" throws an uncaught error - cannot read properties of undefined (length)
    //Lesson? - props passed to components may initially be undefined, despite hte fact that they are not defined 
    //as optional in defineProps<> 
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

</script>

<style>

th {
    font-weight: 400;
}

td, th {
    text-align: center; 
    vertical-align: middle;
}

tr>td {
    border-right: 1px solid gray;
    border-collapse: collapse;
}

tr>td:last-of-type {
    border-style: none;
    border-width: 0;
}

</style>