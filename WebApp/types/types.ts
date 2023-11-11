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

export interface sensorDataType {
    time: string,
    temp: number,
    rehu: number,
    co2c: number,
    id: string 
}