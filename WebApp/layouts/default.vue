<template>

<!-- I dont like using so much flex, but i tried doing this other ways, always coming back to flexbox -->

<!-- h-auto + min-h-screen is huge here, otherwise i get a background that does not cover the whole page in some cases -->
<div class="flex flex-col items-center min-h-screen w-full">

    <header class="flex-initial w-full  border-b border-b-ext-gray-3">
        <nav class="flex items-center m-2 h-16">
            <img src="~/public/TFT-przezroczyste.png" alt="TFT logo"
                class="flex-initial grow-[1] object-scale-down max-h-full max-w-full">
            <NuxtLink to="/" class="flex flex-1 justify-center grow-[1]">Home</NuxtLink>
            <NuxtLink to="/displayTv" class="flex flex-1 justify-center grow-[1]">TV</NuxtLink>
        </nav>
    </header>

    <!-- <main class="flex-1 flex flex-col bg-gray-200">
        <div id="content" class="flex flex-col flex-1 basis-full w-5/6 mx-auto ">
            <slot />
        </div>
    </main> -->

    <main id="content" class="flex-1 flex flex-col w-5/6">
        <slot />
    </main>

</div>

</template>

<style>

@media (max-width: 750px){
    #content {
        width: 100%
    }
}



</style>