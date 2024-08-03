// @vitest-environment nuxt
import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { SingleSensorReadingsType } from '~/types/types'
import {registerEndpoint} from '@nuxt/test-utils/runtime'


const mockedSensors = [
    {
        id: '1111',
        iqrfId: 'TEST',
        name: 'T1_001'
    },
    {
        id: '2222',
        iqrfId: 'TEST',
        name: 'T1_002'
    },
    {
        id: '3333',
        iqrfId: 'TEST',
        name: 'T1_003'
    },
    {
        id: '4444',
        iqrfId: 'TEST',
        name: 'T1_004'
    }
]

const mockedSensorData: SingleSensorReadingsType[] = [ 
    {
        room: 'T1_001', 
        iqrfId:  'TEST', 
        id: ['aaa', 'aab', 'aac'], 
        time: ["2017-04-12T05:24:12Z", "2017-04-12T05:30:12Z", "2017-04-12T05:35:12Z"],
        temp: [10, 12, 35],
        rehu: [10, 15, 20],
        co2c: [100, 150, 200]
    },
    {
        room: '', 
        iqrfId:  '', 
        id: [], 
        time: [],
        temp: [],
        rehu: [],
        co2c: []
    },
    {
        room: 'T1_001', 
        iqrfId:  'TEST', 
        id: ['aaa', 'aab', 'aac'], 
        time: ["2017-04-12T05:24:12Z", "2017-04-12T05:30:12Z", "2017-04-12T05:35:12Z"],
        temp: [999, 998, 997],
        rehu: [10, 15, 20],
        co2c: [100, 150, 200]
    },
]

const mockedReadingsResponse = vi.fn()
registerEndpoint('/api/sensors/TEST/readings', mockedReadingsResponse) 
const mockedSensorsResponse = vi.fn()
registerEndpoint('/api/sensors', mockedSensorsResponse)

beforeEach(()=>{
    mockedReadingsResponse.mockClear()
    mockedSensorsResponse.mockClear()
})

/**What to test (uGSD):
 * 1. is the data fetched and reversed properly
 * 2. if api returns empty (no readings found) fSD should also be empty
 * 3. not all sensors provided data (throws error)
 * 4. what happens if the fetch that just returns registered sensors returns nothing
 * 5. if fSD truncated properly once more readings are fetched than there is space for them?
 */
describe('getFirstBatchSensorData', ()=>{


    test('fetched data is reversed properly', async()=>{
        mockedReadingsResponse.mockImplementation(()=>(mockedSensorData[0]))
        mockedSensorsResponse.mockImplementation(()=>({sensors: mockedSensors}))

        const {fetchedSensorData, getFirstBatchSensorData} = useGetSensorData()
        await getFirstBatchSensorData(3) //the number here does not matter
        expect(fetchedSensorData.value[0].temp).toStrictEqual([35, 12 ,10])
        expect(fetchedSensorData.value[0].rehu).toStrictEqual([20, 15 ,10])
        expect(fetchedSensorData.value[0].id).toStrictEqual(['aac', 'aab', 'aaa'])
    })

    test('api returns no readings', async()=>{
        mockedReadingsResponse.mockImplementation(()=>(mockedSensorData[1]))
        mockedSensorsResponse.mockImplementation(()=>({sensors: mockedSensors}))

        const {fetchedSensorData, getFirstBatchSensorData} = useGetSensorData()
        await getFirstBatchSensorData(3) //the number here does not matter
        expect(fetchedSensorData.value[0].temp).toStrictEqual([])
        expect(fetchedSensorData.value[0].rehu).toStrictEqual([])
        expect(fetchedSensorData.value[0].id).toStrictEqual([])
        expect(fetchedSensorData.value[0].iqrfId).toStrictEqual('')

    })

    //dont know how to implement that
    // test('not all sensors provided data', async()=>{
    //     mockedReadingsResponse.mockImplementation(()=>(mockedSensorData[0]))
    // })

    test('no registered sensors have been returned', async()=>{
        mockedSensorsResponse.mockImplementation(()=>{sensors: []})

        const {fetchedSensorData, getFirstBatchSensorData} = useGetSensorData()
        expect(async()=>await getFirstBatchSensorData(3)).rejects.toThrowError('Error fetching a list of available sensors')
    })
})

/**What to test (pollServerForNewReadings):
 * 1. Are the new readings properly sewn together with the old ones
 * 2. Am i doubling any readings (last from the old batch is the same as the first from the new one)
 * 3. Function properly terminates of not a single sensor returned data
 */
describe('pollServerForNewReadings', ()=>{

    test('old and new readings properly joined together, oldest reading popped', async()=>{
        mockedSensorsResponse.mockImplementation(()=>({sensors: mockedSensors}))
        mockedReadingsResponse.mockImplementation(()=>(mockedSensorData[0]))
        const {fetchedSensorData, iqrfIdSensorList, getFirstBatchSensorData, pollServerForNewReadings} = useGetSensorData()

        //just a setup test
        await getFirstBatchSensorData(3) //does not matter the argument
        expect(fetchedSensorData.value[0].temp).toStrictEqual([35, 12, 10])
        expect(iqrfIdSensorList.value).toStrictEqual(['TEST', 'TEST', 'TEST', 'TEST'])

        //One record too many in fSD, should pop the oldest one from the array
        mockedReadingsResponse.mockImplementation(()=>(mockedSensorData[2]))
        await pollServerForNewReadings(5) //this is also the number controlling how many readings max should be in fSD after each pol
        expect(fetchedSensorData.value[0].temp).toStrictEqual([12, 10, 999, 998, 997])

        //Room for one more record in fSD, should just add newer records without popping anything

    })

    test('old and new readings properly joined together, room for one more', async()=>{
        mockedSensorsResponse.mockImplementation(()=>({sensors: mockedSensors}))
        mockedReadingsResponse.mockImplementation(()=>(mockedSensorData[0]))
        const {fetchedSensorData, iqrfIdSensorList, getFirstBatchSensorData, pollServerForNewReadings} = useGetSensorData()

        await getFirstBatchSensorData(3) //does not matter the argument
        expect(fetchedSensorData.value[0].temp).toStrictEqual([35, 12, 10])
        expect(iqrfIdSensorList.value).toStrictEqual(['TEST', 'TEST', 'TEST', 'TEST'])

        mockedReadingsResponse.mockImplementation(()=>(mockedSensorData[2]))
        await pollServerForNewReadings(7)
        expect(fetchedSensorData.value[0].temp).toStrictEqual([35, 12, 10, 999, 998, 997])
    })

    test('no sensor returned data', async()=>{
        mockedSensorsResponse.mockImplementation(()=>({sensors: mockedSensors}))
        mockedReadingsResponse.mockImplementation(()=>(mockedSensorData[0]))
        const {fetchedSensorData, iqrfIdSensorList, getFirstBatchSensorData, pollServerForNewReadings} = useGetSensorData()

        await getFirstBatchSensorData(3) //does not matter the argument
        expect(fetchedSensorData.value[0].temp).toStrictEqual([35, 12, 10])
        expect(iqrfIdSensorList.value).toStrictEqual(['TEST', 'TEST', 'TEST', 'TEST'])

        mockedReadingsResponse.mockImplementation(()=>(mockedSensorData[1]))
        await pollServerForNewReadings(7)
        expect(fetchedSensorData.value[0].temp).toStrictEqual([35, 12, 10])
    })
})