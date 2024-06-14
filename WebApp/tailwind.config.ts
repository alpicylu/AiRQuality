import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
    darkMode: 'class', // This enables dark mode based on the presence of the "dark" class in the HTML tag
    content: [
        "presets/**/*.{js,vue,ts}" // this is optional if you are using @nuxtjs/tailwindcss
    ],
    theme: {
        extend: {
        colors: {
            //legacy
            'ext-margins' : '#d9d9d9', 
            'ext-content' : '#f5f5f5',
            'ext-okay'    : '#CBFFA9',
            'ext-mid'     : '#FFCF96',
            'ext-bad'     : '#FF8080',

            //my own theme
            'ext-primary-1' : 'var(--ext-primary-1)',
            'ext-primary-2' : 'var(--ext-primary-2)',
            'ext-warning-1'   : 'var(--ext-warning-1)',
            'ext-warning-2'   : 'var(--ext-warning-2)',
            'ext-error-1' : 'var(--ext-error-1)',
            'ext-error-2' : 'var(--ext-error-2)',

            'ext-link' : 'var(--ext-link)',

            'ext-white'     : 'var(--ext-white)',
            'ext-gray-1'    : 'var(--ext-gray-1)',
            'ext-gray-2'    : 'var(--ext-gray-2)',
            'ext-gray-3'    : 'var(--ext-gray-3)',

            //primeVue 
            primary: 'rgb(var(--primary))',
            'primary-inverse': 'rgb(var(--primary-inverse))',
            'primary-hover': 'rgb(var(--primary-hover))',
            'primary-active-color': 'rgb(var(--primary-active-color))',

            'primary-highlight': 'rgb(var(--primary)/var(--primary-highlight-opacity))',
            'primary-highlight-inverse': 'rgb(var(--primary-highlight-inverse))',
            'primary-highlight-hover': 'rgb(var(--primary)/var(--primary-highlight-hover-opacity))',

            'primary-50': 'rgb(var(--primary-50))',
            'primary-100': 'rgb(var(--primary-100))',
            'primary-200': 'rgb(var(--primary-200))',
            'primary-300': 'rgb(var(--primary-300))',
            'primary-400': 'rgb(var(--primary-400))',
            'primary-500': 'rgb(var(--primary-500))',
            'primary-600': 'rgb(var(--primary-600))',
            'primary-700': 'rgb(var(--primary-700))',
            'primary-800': 'rgb(var(--primary-800))',
            'primary-900': 'rgb(var(--primary-900))',
            'primary-950': 'rgb(var(--primary-950))',

            'surface-0': 'rgb(var(--surface-0))',
            'surface-50': 'rgb(var(--surface-50))',
            'surface-100': 'rgb(var(--surface-100))',
            'surface-200': 'rgb(var(--surface-200))',
            'surface-300': 'rgb(var(--surface-300))',
            'surface-400': 'rgb(var(--surface-400))',
            'surface-500': 'rgb(var(--surface-500))',
            'surface-600': 'rgb(var(--surface-600))',
            'surface-700': 'rgb(var(--surface-700))',
            'surface-800': 'rgb(var(--surface-800))',
            'surface-900': 'rgb(var(--surface-900))',
            'surface-950': 'rgb(var(--surface-950))'
        }
        }
    }
}