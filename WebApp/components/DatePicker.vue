<template>

    <!-- <input type="date" :value="pickerDate"
        @input="$emit('update:pickerDate', ($event.target as HTMLSelectElement).value)"
        class="rounded-full p-3" /> -->

    <PrimeDatePicker v-model="model" dateFormat="dd/mm/yy" />
    
</template>

<script setup lang="ts">

const model = defineModel()

</script>