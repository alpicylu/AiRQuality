// https://nuxt.com/docs/api/configuration/nuxt-config
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineNuxtConfig({
    ssr: false,
    devtools: { enabled: true },
    vite: {
        plugins: [
            nodePolyfills()
        ],
    },
    nitro: {
        plugins: ['~/server/plugins/getIQRFData.ts']
    },
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
        'nuxt-primevue',
        '@nuxt/test-utils/module'
    ],
    primevue: {
        options: {
          unstyled: true,
          ptOptions: {
            mergeProps: false
          }
        },
        importPT: { from: path.resolve(__dirname, './presets/aura/') },
        components: {
            prefix: 'Prime'
        },
    },
})
