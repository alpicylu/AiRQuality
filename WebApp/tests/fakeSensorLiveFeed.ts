import type {SingleSensorReadingsType} from '~/types/types'

/**Only for testing purposes
 * Push fake readings into the local (test) database
 */
function generateForOneSensor() {
    //Randomize the number of readings that will be "fetched"
    const n = Math.random() * (4 - 0) + 0;
    let result: SingleSensorReadingsType = <SingleSensorReadingsType>{}
    result.co2c = []
    result.temp = []
    result.rehu = []
    result.id = []
    result.time = []
    result.iqrfId = "TEST"
    
    for (let i=0; i<=n; ++i){
        result.temp.push(Math.random() * (31 - 10) + 10) //10-30 degC
        result.rehu.push(Math.random() * (1 - 91) + 1) //1-90 %
        result.co2c.push(Math.random() * (2001 - 100) + 100) //100-2000 ppm
        result.time.push(new Date().toISOString())
        result.id.push('0') //does not matter
    }
    return result
}

function generateForAllSensors(nSensors: number){

    const fetchedFakeSensorData: SingleSensorReadingsType[] = []

    for (let i=0; i<nSensors; ++i){
        fetchedFakeSensorData.push(generateForOneSensor())
    }

    return fetchedFakeSensorData
}

export default function(nSensors: number){

    const fetchedSensorData = ref<SingleSensorReadingsType[]>([])
    const iqrfIdSensorList = ref<string[]>([])
    
    const getFirstBatchSensorData = () => {
        let tempSensorData: Array<SingleSensorReadingsType> = []
        let tempIqrfList: Array<string> = []

        for (let i=0; i<nSensors; ++i){
            tempIqrfList.push(`TST${i}`)
        }

        tempSensorData = generateForAllSensors(nSensors)


        /* Fetching with order=desc returns the most recent readings but in reverse-chrono order. This loop
        returns the data to its chronological order. */
        tempSensorData.forEach(sensor => {
            sensor.id.reverse()
            sensor.time.reverse()
            sensor.temp.reverse()
            sensor.rehu.reverse()
            sensor.co2c.reverse()
        })
        fetchedSensorData.value = tempSensorData
        iqrfIdSensorList.value = tempIqrfList
    }

    const pollServerForNewReadings = (nSensors: number) => {
        //here, i shall abuse the fact that The fulfillment value is an array of fulfilled promises, 
        //in the order of the promises passed, regardless of completion order
        //The order of readings fetched here and the initial fetch from getFirstBatch... is coordinated by 2 things:
        //1. the iqrfIdSensorList array, which is populated in getFirstBatch and stays unchanged after that
        //2. Promise.all returns fulfillment values in the same order that the promises inside of it were passed.
        //The order of sensors here and in the fetchedSensorData array is the same.
        //And i know the promises will be created in the same order because in both cases they are created from the iqrfSensorList arr.
        let newReadings: SingleSensorReadingsType[] = generateForAllSensors(nSensors)


        //dont update readings from sensors that fetched null
        //the i index represents individual sensors (SingleSensorReadingsType objects)
        for (let i=0; i<newReadings.length; ++i){
            if (newReadings[i] === null) continue   //dunno why i need to coerce the null here
            fetchedSensorData.value[i].id = fetchedSensorData.value[i].id.concat(newReadings[i]!.id)
            fetchedSensorData.value[i].time = fetchedSensorData.value[i].time.concat(newReadings[i]!.time)
            fetchedSensorData.value[i].temp = fetchedSensorData.value[i].temp.concat(newReadings[i]!.temp)
            fetchedSensorData.value[i].rehu = fetchedSensorData.value[i].rehu.concat(newReadings[i]!.rehu)
            fetchedSensorData.value[i].co2c = fetchedSensorData.value[i].co2c.concat(newReadings[i]!.co2c)

            if (fetchedSensorData.value[i].id.length > nSensors){
                const nOldRecordsToRemove = newReadings[i]!.id.length
                fetchedSensorData.value[i].id = fetchedSensorData.value[i].id.slice(nOldRecordsToRemove)
                fetchedSensorData.value[i].time = fetchedSensorData.value[i].time.slice(nOldRecordsToRemove)
                fetchedSensorData.value[i].temp = fetchedSensorData.value[i].temp.slice(nOldRecordsToRemove)
                fetchedSensorData.value[i].rehu = fetchedSensorData.value[i].rehu.slice(nOldRecordsToRemove)
                fetchedSensorData.value[i].co2c = fetchedSensorData.value[i].co2c.slice(nOldRecordsToRemove)
            }
        }
    }

    return {
        iqrfIdSensorList, fetchedSensorData,
        getFirstBatchSensorData, pollServerForNewReadings
    }
    
}