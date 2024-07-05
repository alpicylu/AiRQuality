<template>
<div>
    <PrimeCalendar v-model="date" dateFormat="dd/mm/yy" :placeholder="props.phText" :maxDate="new Date()" :minDate="props.minDate"
        pt:root:class="flex justify-center h-full w-full"
        pt:input:class="flex-auto rounded-full text-center h-full">
    </PrimeCalendar>
</div>
</template>

<script setup lang="ts">
/**That empty div is for the purpose of allowing styling of that component outside of it */

//seems that this date model property is not externalized from this component - the v-model that binds an external ref
//does not "forward" the data from this component to the external ref.
const date = defineModel<Date | Date[] | (Date | null)[] | null>('date')
const props = defineProps<{
    phText: string,
    minDate?: Date
}>()


</script>