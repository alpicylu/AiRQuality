import {describe, test, expect} from 'vitest'
import {formatDates, getFormatBasedOnDateDiff} from '~/utils/formatDateTimeStrings'
import { DateTime } from 'luxon'

describe("date format function", ()=>{
    test("formats to hh:mm", ()=>{
        const date = ["2017-04-12T05:24:12Z"]
        const timezone = "UTC+1"
        expect(formatDates(date, "HH:mm", timezone)).toStrictEqual(["06:24"])
    })

    test("formats to dd.MM.yy", ()=>{ 
        const date = ["2021-10-02T22:13:02Z"]
        const timezone = "UTC+3"
        expect(formatDates(date, "dd.MM.yy", timezone)).toStrictEqual(["03.10.21"])
    })

    test('formats to local by default', ()=>{
        const date = ['2021-10-02T22:13:02Z']
        //fromISO, if no zone or setZone options were provided, will express the given ISO date in the local timezone
        //so 22:13:02 in CEST (UTC+2) becomes 00:13:02
        const expected = DateTime.fromISO(date[0]).toFormat('hh:mm')
        expect(formatDates(date, 'hh:mm')).toStrictEqual([expected])
    })
})
