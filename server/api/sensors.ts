export default defineEventHandler(async () => {
    //this will be a post request in the future, 
    //because i need to inform the server about the room whose data i want ot get
    //from the cloud

    const sensorData = await $fetch("https://650b0d28dfd73d1fab097d2a.mockapi.io/test/iqrf/sensor", {
        method: 'GET',
        headers: {'content-type':'application/json'},
    })

    console.log("dupa")
    // console.log(sensorData)
    return sensorData

})