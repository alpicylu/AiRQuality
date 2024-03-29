import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
    theme: {
      extend: {
        colors: {
          'ext-margins' : '#d9d9d9', 
          'ext-content' : '#f5f5f5',
          'ext-okay'    : '#CBFFA9',
          'ext-mid'     : '#FFCF96',
          'ext-bad'     : '#FF8080'
        }
      }
  }
}