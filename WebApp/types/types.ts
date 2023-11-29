/* i wanted to create those enums to avoid passing string literals through components, emits, etc.
Especially helpful in the GeneralChart component 

TODO: make this a module in the /modules dir.
*/



//TODO divide enums and types/interfaces into separate files (both under types/)
//TODO 2 consider refactoring time into a Date object. I dont see much point in storing it as string
//TODO 3 rename id to sensorId
//TODO 4 consider making Single... a class (with methods like avg, min, max etc.)

//What you get from 1 sensor after asking it about the weather + time
export interface SensorDataType {
    time: string,
    temp: number,
    rehu: number,
    co2c: number,
    id: string //ID of the sensor this reading belongs to
}

//A collection of some/all readings from a single sensor during a period of time
export interface SingleSensorReadingsType {
    room: string, //room/name assigned to sensor
    iqrfId: string, //ID assigned to a sensor in IQRF IDE
    id: string[], //id of a single reading (the T RH CO2 trio)
    time: string[],
    temp: number[],
    rehu: number[],
    co2c: number[]
}

// export class SingleSensorReadingsType {
//     room: string; //room/name assigned to sensor
//     iqrfId: string; //ID assigned to a sensor in IQRF IDE
//     id: string[]; //id of a single reading (the T RH CO2 trio)
//     time: string[];
//     temp: number[];
//     rehu: number[];
//     co2c: number[]
// }