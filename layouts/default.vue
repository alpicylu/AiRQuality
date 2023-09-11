<template>
    <div class="w-screen h-screen flex flex-row justify-around bg-ext-margins">
        <div class="w-5/6 overflow-hidden bg-ext-content">
            <header>
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
            <body>
                <slot />
            </body>    
        </div>
    </div>
</template>