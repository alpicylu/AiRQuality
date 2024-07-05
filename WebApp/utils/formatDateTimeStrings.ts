import {DateTime} from 'luxon'

/* The purpose of those functions is to format date strings to be displayed on charts
ChartJS DOES have build in time-axis formatting, but i cant really get it to work .*/

/**
 * 
 * @param dates an array of ISO datetime strings in UTC timezone. Example: 2011-10-05T14:48:00.000Z
 * @returns an array of "HH:mm", according to the local timezone 
 */

export function formatDates(dates: string[], format: string, tz: string = 'local'){
    let formattedDates: string[] = []
    dates.forEach(el => {
        //check if date conforms to format?
        const dateTimeObj = DateTime.fromISO(el).setZone(tz)
        const formattedDate = dateTimeObj.toFormat(format)
        formattedDates.push(formattedDate)
    })
    return formattedDates
}

/**Returns difference between 2 dates, in days */
export function calcDateDiff(dateA: string, dateB: string): number{
    const dateTimestampA = new Date(dateA).getTime()
    const dateTimestampB = new Date(dateB).getTime()

    const diffTime = Math.abs(dateTimestampA - dateTimestampB)
    const diffDays = Math.ceil(diffTime / (1000*60*60*24))
    return diffDays
}

export function getFormatBasedOnDateDiff(dateA: string|undefined, dateB: string|undefined){
    if (dateA == undefined || dateB == undefined) return ''
    const daysOfDifference = calcDateDiff(dateA, dateB)
    
    if (daysOfDifference <= 1){
        return 'hh:mm'
    }
    else if (daysOfDifference > 1 && daysOfDifference <= 14){
        return "hh'h dd.MM"
    }
    else if (daysOfDifference > 14 && daysOfDifference <= 30){
        return "dd.MM"
    }
    else {
        return "dd.MM.yy"
    }
}