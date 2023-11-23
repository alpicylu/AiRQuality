<template>

    <div class="flex flex-initial h-full w-full bg-red-200">

        <div class="flex flex-col flex-1 justify-between gap-4">
            <div class="basis-1/12 flex justify-center items-center">SALA</div>

            <div class="basis-3/12 bg-yellow-400">chart</div>
            <div class="basis-3/12 bg-yellow-400">chart</div>
            <div class="basis-3/12 bg-yellow-400">chart</div>

            <div class="basis-1/12 flex justify-around items-center">
                <button>DATE A</button>
                <button>DATE B</button>
            </div>
        </div>

        <div class="flex flex-col flex-1 justify-between bg-green-200">
            <table class="basis-1/12">
                <tr>
                    <th>NOW</th>
                    <th>MIN</th>
                    <th>MAX</th>
                    <th>AVG</th>
                </tr>
            </table>

            <table class="basis-9/12">
                <tr>
                    <td>a</td>
                    <td>b</td>
                    <td>c</td>
                    <td>c</td>
                </tr>
                <tr>
                    <td>d</td>
                    <td>e</td>
                    <td>f</td>
                    <td>f</td>
                </tr>
                <tr>
                    <td>g</td>
                    <td>h</td>
                    <td>i</td>
                    <td>i</td>
                </tr>
            </table>
            
            <div class="basis-1/12 flex justify-around items-center">
                <button>CSV</button>
            </div>

        </div>
    </div>

    
    
</template>


<script setup lang="ts">



</script>


<style>

    td {
        text-align: center; 
        vertical-align: middle;
    }

    tr>td {
        border-right: solid gray;
    }

    tr>td:last-of-type {
        border-style: none;
    }

</style>