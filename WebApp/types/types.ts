/* i wanted to create those enums to avoid passing string literals through components, emits, etc.
Especially helpful in the GeneralChart component 

TODO: make this a module in the /modules dir.
*/

export enum DisplayType {
    Temp = "Temperature",
    Rehu = "Rel. humidity",
    CO2c = "CO2 content"
}

export enum SortOptions {
    Rasc = "Room Ascending",
    Rdes = "Room Descending",
    Tasc = "Temperature Ascending",
    Tdes = "Temperature Descending",
}

//TODO divide enums and types/interfaces into separate files (both under types/)
//TODO 2 consider refactoring time into a Date object. I dont see much point in storing it as string
//TODO 3 rename id to sensorId

export interface SensorDataType {
    time: string,
    temp: number,
    rehu: number,
    co2c: number,
    id: string //ID of the sensor this reading belongs to
}

export interface SingleSensorReadingsType {
    room: string,
    time: string[],
    temp: number[],
    rehu: number[],
    co2c: number[]
}