// https://nuxt.com/docs/api/configuration/nuxt-config
import path from 'path'

export default defineNuxtConfig({
    ssr: false,
    devtools: { enabled: true },
    app: {
        head: {
            title: "AiRQuality"
        },
    },
    typescript: {
        typeCheck: true
    },
    modules: [
        '@nuxtjs/tailwindcss',
        '@primevue/nuxt-module'
    ],
    primevue: {
        options: {
          unstyled: true,
          ptOptions: {
            mergeProps: true
          }
        },
        importPT: { from: path.resolve(__dirname, './presets/aura/') },
        components: {
            prefix: 'Prime'
        },
        
    }
})
