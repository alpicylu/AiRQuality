import {DisplayType, ChartHealthStatus} from '~/types/enums'


export default function (){

    const bgColor = ref(ChartHealthStatus.Red)

    const updateBgColor = (data: number[], readingsType: DisplayType) => { //FUNCTION TO ALTER THE STATE
        const mostRecentDataPointValue = data[data.length-1]
        let currentReadingQuality: ChartHealthStatus
        try {
            currentReadingQuality = calculateSafetyValue(mostRecentDataPointValue, readingsType)
        } catch (err) {
            currentReadingQuality = ChartHealthStatus.Error
            console.log(err)
        }
        bgColor.value = currentReadingQuality
    }

    //EXPOSE the state and the state-alter function
    return { bgColor, updateBgColor } 

}


// export default function (data: number[], readingsType: DisplayType){
    
//     const todoList = useState('key', () => Array<string>())

//     const addTodo = (payload: string) => {
//         todoList.value = [...todoList.value, payload]
//     }

//     return {todoList, addTodo}
// }