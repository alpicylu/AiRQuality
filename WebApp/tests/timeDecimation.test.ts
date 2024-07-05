import { describe, expect, test } from 'vitest'
import {formatDates, getFormatBasedOnDateDiff} from '~/utils/formatDateTimeStrings'


describe("time decimation", ()=>{
    test.todo('decimate over 12h period', ()=>{
        
    })
})

/**What happens if:
 * There is just not enough readings to decimate from
 * There is a significant gap between readings, eg. when theres been a power outage.
 */