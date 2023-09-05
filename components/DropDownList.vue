<template>
    <form>
        <label for="name.toLowerCase()">{{ name }}</label>
        <select name="name.toLowerCase()" id="name.toLowerCase()">
            <option v-for="opt in options"
                :key="opt"
                :value="opt.toLowerCase()">{{ opt }}
            </option>
        </select>
    </form>
</template>

<script setup lang="ts">

let x: number;

const props = defineProps<{
    modelValue: string, //v-model prop
    name: string,
    options: string[]
}>()

</script>