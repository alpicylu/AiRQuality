<template>
    <div class="w-screen h-screen bg-ext-margins">
        <div class="flex flex-col flex-auto items-center w-5/6 mx-auto h-full bg-ext-content">
            <header class="flex-initial w-full">
                <nav>
                <div class="flex justify-evenly items-start mt-2">
                    <NuxtLink to="/">Home</NuxtLink>
                    <NuxtLink to="/testPage">Settings</NuxtLink>
                    <NuxtLink>Log In</NuxtLink>
                    <NuxtLink>Help</NuxtLink>
                    <NuxtLink>About</NuxtLink>
                </div>
                </nav>
            </header>

            <slot />

            <footer class="h-10"></footer>
        </div>
    </div>
</template>