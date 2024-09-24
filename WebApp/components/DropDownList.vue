<template>
    <form class="flex flex-1 basis-52 flex-wrap w-4/12 justify-center">
        <label :for="name" class="whitespace-nowrap mr-2">{{ name }}:</label>
        <select :name="name.toLowerCase()" :id="name" :value="selectedOption"
            @input="$emit('update:selectedOption', ($event.target as HTMLSelectElement).value)"
            class="flex flex-initial px-5 rounded-full min-w-0">
            <option class="" v-for="(opt, index) in options"
                :key="opt"
                :value="opt">{{ opt }}
            </option>
        </select>
    </form>
</template>

<script setup lang="ts">

let x: number;

const props = defineProps<{
    selectedOption: string, //v-model prop
    name: string,
    options: string[]
}>()

const emits = defineEmits<{
    "update:selectedOption": [option: string]
}>()

</script>