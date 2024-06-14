
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

/**Enums can only be initialised with constants/literals.
 * Define colors in a different structure.
 * DEPRECATED
 */
export enum ChartHealthStatus {
    Green = '#CBFFA9',
    // Test = getComputedStyle(document.documentElement).getPropertyValue('--ext-primary-1'),
    Yellow = '#FFCF96',
    Red = '#FF8080',
    // Error = '#FFFFFF'
    Error = '#2596BE'
}


