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

// export function formatDatesToHourDayMonth(dates: string[]){
//     let formattedDates: string[] = []
//     dates.forEach(el => {
//         const dateObj = new Date(el)
//         let hours: number = dateObj.getHours()

//         let day: number|string = dateObj.getDate()
//         if (day < 10) day = `0${day.toString()}`

//         let month: number|string = dateObj.getMonth() + 1
//         if (month < 10) month = `0${month.toString()}`

//         formattedDates.push(`${hours}h ${day}.${month}`)
//     })
//     return formattedDates
// }

export function formatDatesToHourDayMonth(dates: string[]){
    let formattedDates: string[] = []
    dates.forEach(el => {
        const dateTimeObj = DateTime.fromISO(el).toLocal()
        const formattedDate = dateTimeObj.toFormat("HH'h' dd.MM")
        formattedDates.push(formattedDate)
    })
    return formattedDates
}

// export function formatDatesToDayMonth(dates: string[]){
//     let formattedDates: string[] = []
//     dates.forEach(el => {
//         const dateObj = new Date(el)
//         let day: number|string = dateObj.getDate()
//         if (day < 10) day = `0${day.toString()}`

//         let month: number|string = dateObj.getMonth() + 1
//         if (month < 10) month = `0${month.toString()}`

//         formattedDates.push(`${day}.${month}`)
//     })
//     return formattedDates

// }
export function formatDatesToDayMonth(dates: string[]){
    let formattedDates: string[] = []
    dates.forEach(el => {
        const dateTimeObj = DateTime.fromISO(el).toLocal()
        const formattedDate = dateTimeObj.toFormat("dd.MM")
        formattedDates.push(formattedDate)
    })
    return formattedDates
}

// export function formatDatesToDayMonthYear(dates: string[]){
//     let formattedDates: string[] = []
//     dates.forEach(el => {
//         const dateObj = new Date(el)
//         let day: number|string = dateObj.getDate()
//         if (day < 10) day = `0${day.toString()}`

//         let month: number|string = dateObj.getMonth() + 1
//         if (month < 10) month = `0${month.toString()}`

//         let year: number = dateObj.getFullYear()

//         formattedDates.push(`${day}.${month}.${year.toString().slice(2)}`)
//     })
//     return formattedDates
// }

export function formatDatesToDayMonthYear(dates: string[]){
    let formattedDates: string[] = []
    dates.forEach(el => {
        const dateTimeObj = DateTime.fromISO(el).toLocal()
        const formattedDate = dateTimeObj.toFormat("dd.MM.yy")
        formattedDates.push(formattedDate)
    })
    return formattedDates
}
