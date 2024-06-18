import {DisplayType, ChartHealthStatus} from '~/types/enums'
import {colorPaletteObj} from '~/constants/colors'
import {colorCalculateTest} from '~/utils/calculateSafetyValue'

export default function() {
    
    const bgColor = ref(colorPaletteObj.extError1)

    const updateBgColor = (data: number|undefined, readingsType: DisplayType) => { //FUNCTION TO ALTER THE STATE
        
        if (data === undefined) return
        let currentReadingQuality
        try {
            currentReadingQuality = colorCalculateTest(data, readingsType)
        } catch (err) {
            currentReadingQuality = colorPaletteObj.extError2
            console.log(err)
        }
        bgColor.value = currentReadingQuality
    }

    //EXPOSE the state and the state-alter function
    return { bgColor, updateBgColor } 
}