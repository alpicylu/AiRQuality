import {DateTime} from 'luxon'

/* The purpose of those functions is to format date strings to be displayed on charts
ChartJS DOES have build in time-axis formatting, but i cant really get it to work .*/

/**
 * 
 * @param dates an array of ISO datetime strings in UTC timezone
 * @returns an array of "HH:mm", according to the local timezone 
 */
export function formatDatesToHourMinute(dates: string[]){
    let formattedDates: string[] = []
    dates.forEach(el => {
        const dateTimeObj = DateTime.fromISO(el).toLocal()
        const formattedDate = dateTimeObj.toFormat("HH:mm")
        formattedDates.push(formattedDate)
    })
    return formattedDates
}

export function formatDatesToHourDayMonth(dates: string[]){
    let formattedDates: string[] = []
    dates.forEach(el => {
        const dateTimeObj = DateTime.fromISO(el).toLocal()
        const formattedDate = dateTimeObj.toFormat("HH'h' dd.MM")
        formattedDates.push(formattedDate)
    })
    return formattedDates
}

export function formatDatesToDayMonth(dates: string[]){
    let formattedDates: string[] = []
    dates.forEach(el => {
        const dateTimeObj = DateTime.fromISO(el).toLocal()
        const formattedDate = dateTimeObj.toFormat("dd.MM")
        formattedDates.push(formattedDate)
    })
    return formattedDates
}

export function formatDatesToDayMonthYear(dates: string[]){
    let formattedDates: string[] = []
    dates.forEach(el => {
        const dateTimeObj = DateTime.fromISO(el).toLocal()
        const formattedDate = dateTimeObj.toFormat("dd.MM.yy")
        formattedDates.push(formattedDate)
    })
    return formattedDates
}
