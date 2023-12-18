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