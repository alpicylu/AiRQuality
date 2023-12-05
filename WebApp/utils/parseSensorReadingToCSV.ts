import type {SingleSensorReadingsType} from '~/types/types'

export default function(data: SingleSensorReadingsType) {
    let csv = ''
    const headers: string[] = Object.keys(data).slice(2)

    csv = headers.reduce((accu, elem) => {
        return (`${accu},${elem}`)
    })
    csv = csv.concat('\n')

    for (let i = 0; i < data.id.length; ++i){
        let row: (string|number)[] = []
        for (let [key, val] of Object.entries(data).slice(2)){
            row.push(val[i])
        }
        csv = csv.concat(row.join(','))
        csv = csv.concat('\n')
    }

    return csv
}