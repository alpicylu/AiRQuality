


export default function(dates: string[]){
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