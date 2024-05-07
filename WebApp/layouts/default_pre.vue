<template>
    <main id="main" class="w-full bg-ext-margins">
        <div id="content" class="flex flex-col flex-auto items-center w-5/6 mx-auto h-full bg-ext-content">
            <header class="flex-initial w-full">
                <nav>
                <div class="flex justify-evenly items-start mt-2">
                    <NuxtLink to="/">Home</NuxtLink>
                    <NuxtLink to="/displayTv">TV</NuxtLink>
                    <NuxtLink class="opacity-50">Log In</NuxtLink>
                    <NuxtLink class="opacity-50">About</NuxtLink>
                </div>
                </nav>
            </header>

            <slot />

        </div>
    </main>
</template>

<style>

@media (max-width: 750px){
    #content {
        width: 100%
    }
    #main {
        height: auto;
    }
}

</style>