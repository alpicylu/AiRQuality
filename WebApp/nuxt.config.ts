// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    nitro: {
        preset: 'node-server'
    },
    ssr: false,
    devtools: { enabled: true },
    app: {
        head: {
            title: "AiRQuality"
        }
    },
    typescript: {
        typeCheck: true
    },
    modules: [
        '@nuxtjs/tailwindcss',
    ],
})
