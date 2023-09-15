<template>
    <div class="w-screen h-screen bg-ext-margins">
        <div class="flex flex-col flex-auto w-5/6 mx-auto h-full bg-ext-content">
            <header class="flex-initial">
                <nav>
                <div class="flex justify-evenly items-start mt-2">
                    <NuxtLink to="/">Home</NuxtLink>
                    <NuxtLink>Settings</NuxtLink>
                    <NuxtLink>Log In</NuxtLink>
                    <NuxtLink>Help</NuxtLink>
                    <NuxtLink>About</NuxtLink>
                </div>
                </nav>
            </header>
            <!-- <div> -->
            <slot />
            <!-- </div> -->

        </div>
    </div>
</template>