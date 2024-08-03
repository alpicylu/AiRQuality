import type { SensorDataType } from "~/types/types"

/*This server can get multiple data-bearing responses per request, so multiple records can be saved to DB at a time.
Every record that was transmited to the cloud (those marked as "Rx" in the iqrf cloud admin page) is downloaded.
Not every record contains useful data - some records basically tell the cloud, that a request was sent to the GW - those are useless to us.
After download the plugin determines which records contain sensor data, and which dont. Those that dont are simply 
represented as null. Those that do are treated as an object of type "SensorDataType"
Here, we get an array of data-bearing-objects and nulls (nulls are the boring, data-less records from IQRFCloud).
The interesting objects are saved to the DB. */

/**The reason i moved this function to a separate file is because i could test it
 * (and the functions that use this function) much easier. Also, keeping functions that
 * communicate with APIs or DB in separate modules seems like a good practice. */
export async function insertToDB(data: (SensorDataType | null)[]): Promise<void> {

    await Promise.all(
        data.map((element) => {
            if (element !== null)
                return $fetch(`/api/sensors/${element.id}/readings`, {
                    method: 'POST',
                    body: element
            })
        })
    )
    .then(res => console.log("Fetched sensor readings saved to DB"))
    .catch(err => {
        console.log("Some sensor data failed to be saved to DB")
        console.log(err)
    })
}  