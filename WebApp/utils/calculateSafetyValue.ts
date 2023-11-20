import {DisplayType, ChartHealthStatus} from '~/types/enums'


//0 - safe, green
//1 - mildly unhealthy, yellow
//2 - unhealthy, red
//3 - error
export default function(reading: number, type: DisplayType): ChartHealthStatus{

    switch (type){
        case DisplayType.Temp:
            if (reading >= 18 && reading <= 22) return ChartHealthStatus.Green
            else if ( (reading >= 14 && reading <= 18) || ( reading >= 22 && reading <= 26 )) return ChartHealthStatus.Yellow
            else if (reading < 14 || reading > 26) return ChartHealthStatus.Red
            break
        case DisplayType.Rehu:
            if (reading > 30 && reading < 50) return ChartHealthStatus.Green
            else if ( (reading >= 20 && reading < 30) || ( reading > 50 && reading < 60) ) return ChartHealthStatus.Yellow
            else if (reading < 20 || reading > 60) return ChartHealthStatus.Red
            break
        case DisplayType.CO2c:
            if (reading < 1000) return ChartHealthStatus.Green
            else if (reading > 1000 && reading < 2000) return ChartHealthStatus.Yellow
            else if (reading > 2000) return ChartHealthStatus.Red
            break
    }

    throw new Error("Reading value's health status could not be assessed")
}