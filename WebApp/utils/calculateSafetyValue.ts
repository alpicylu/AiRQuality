import {DisplayType, ChartHealthStatus} from '~/types/enums'
import {colorPaletteObj} from '~/constants/colors'

export function colorCalculateTest(reading: number, type: DisplayType): string {

    switch (type){
        case DisplayType.Temp:
            if (reading > 18 && reading < 22) return colorPaletteObj.extPrimary1
            else if ( (reading >= 14 && reading <= 18) || ( reading >= 22 && reading <= 26 )) return colorPaletteObj.extWarning1
            else if (reading < 14 || reading > 26) return colorPaletteObj.extError1
            break
        case DisplayType.Rehu:
            if (reading > 30 && reading < 50) return colorPaletteObj.extPrimary1
            else if ( (reading >= 20 && reading <= 30) || ( reading >= 50 && reading <= 60) ) return colorPaletteObj.extWarning1
            else if (reading < 20 || reading > 60) return colorPaletteObj.extError1
            break
        case DisplayType.CO2c:
            if (reading < 1000) return colorPaletteObj.extPrimary1
            else if (reading >= 1000 && reading <= 2000) return colorPaletteObj.extWarning1
            else if (reading > 2000) return colorPaletteObj.extError1
            break
    }

    throw new Error(`Reading value's health status could not be assessed: ${type}, ${reading}`)
}