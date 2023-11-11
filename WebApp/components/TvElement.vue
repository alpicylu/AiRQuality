<template>
    <div class="border-rose-400 border-2 w-full h-full">

        <div class="flex flex-row justify-between items-center h-1/6 w-full bg-black text-white text-5xl">
            <div>C1 234</div>
            <div>T</div>
            <div class="grid grid-cols-12 text-base h-full">
                <div class="col-span-1 text-3xl text-vert">NOW</div>
                <div class="col-span-3 text-5xl flex justify-center items-center">1234</div>

                <div class="col-span-1 text-3xl text-vert">MIN</div>
                <div class="col-span-3 text-5xl flex justify-center items-center">23</div>

                <div class="col-span-1 text-3xl text-vert">MAX</div>
                <div class="col-span-3 text-5xl flex justify-center items-center">23</div>
            </div>
            <div>C deg</div>
        </div>
        <div class="h-5/6 w-full bg-violet-400">body</div>

    </div>
</template>


<script setup lang="ts">




</script>



<style>

/* TW does not support vertical text alignment at its core */
.text-vert {
    writing-mode: vertical-lr;
    text-orientation: upright;
    letter-spacing: -0.6rem;
}

</style>