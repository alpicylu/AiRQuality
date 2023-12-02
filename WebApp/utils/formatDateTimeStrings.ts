

/* The purpose of this function is to format date strings to be displayed on charts
ChartJS does have build in time-axis formatting, but i cant really get it to work 
I Could do this with regex though.*/
export function formatDatesToHourMinute(dates: string[]){
    let formattedDates: string[] = []
    dates.forEach(el => {
        const dateObj = new Date(el)
        let minutes: number|string = dateObj.getMinutes()
        let hours: number = dateObj.getHours()
        if (minutes < 10) minutes = `0${minutes.toString()}`

        formattedDates.push(`${hours}:${minutes}`)
    })
    return formattedDates
}

export function formatDatesToHourDayMonth(dates: string[]){
    let formattedDates: string[] = []
    dates.forEach(el => {
        const dateObj = new Date(el)
        let hours: number = dateObj.getHours()

        let day: number|string = dateObj.getDate()
        if (day < 10) day = `0${day.toString()}`

        let month: number|string = dateObj.getMonth() + 1
        if (month < 10) month = `0${month.toString()}`

        formattedDates.push(`${hours}h ${day}.${month}`)
    })
    return formattedDates

}

export function formatDatesToDayMonth(dates: string[]){
    let formattedDates: string[] = []
    dates.forEach(el => {
        const dateObj = new Date(el)
        let day: number|string = dateObj.getDate()
        if (day < 10) day = `0${day.toString()}`

        let month: number|string = dateObj.getMonth() + 1
        if (month < 10) month = `0${month.toString()}`

        formattedDates.push(`${day}.${month}`)
    })
    return formattedDates

}

export function formatDatesToDayMonthYear(dates: string[]){
    let formattedDates: string[] = []
    dates.forEach(el => {
        const dateObj = new Date(el)
        let day: number|string = dateObj.getDate()
        if (day < 10) day = `0${day.toString()}`

        let month: number|string = dateObj.getMonth() + 1
        if (month < 10) month = `0${month.toString()}`

        let year: number = dateObj.getFullYear()

        formattedDates.push(`${day}.${month}.${year.toString().slice(2)}`)
    })
    return formattedDates

}
