<template>

    <input type="date" :value="pickerDate"
        @input="$emit('update:pickerDate', ($event.target as HTMLSelectElement).value)"
        class="rounded-full p-3 bg-ext-margins" />
    
</template>

<script setup lang="ts">

const props = defineProps<{
    pickerDate: string
}>()

const emits = defineEmits<{
    "update:pickerDate": [date: string]
}>()


</script>