// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    ssr: false,
    devtools: { enabled: true },
    typescript: {
        typeCheck: true
    },
    modules: [
        '@nuxtjs/tailwindcss',
        '@sidebase/nuxt-auth'
    ],
    auth: {
        provider: {
            type: 'local',
            sessionDataType: {
              	id: 'string',
				name: 'string',
				role: 'guest | admin' 
            }
        },
        isEnabled: true,
    }
})
