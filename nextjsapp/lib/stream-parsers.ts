import {type AIStreamParser} from 'ai'

// function pythonToJSFormat(data: string): string {


//     // Replace single quotes with double quotes, but only when they are not escaped or inside other quotes
//     let formattedData = data.replace(/\\?.*?'/g, function (s) {
//         // It's a single quote, replace it with double quote
//         return s.replace(/'/g, '"');
//     });
    

//     formattedData = formattedData.replace(/True/g, 'true')
//     formattedData = formattedData.replace(/False/g, 'false')
//     formattedData = formattedData.replace(/None/g, 'null')
//     return formattedData
// }

//TODO use AI Stream here
export function parseOpenInterpreterStream(): AIStreamParser {
    return (data: string) => {
        console.log(data)
        return data
        // const formattedData = pythonToJSFormat(data)
        // // later, add any parsing logic here
        // // get first key of object
        // try{
        //     const parsedData = JSON.parse(formattedData)
        //     console.log(parsedData)
        //     const keys = Object.keys(parsedData)
        //     const key = keys[0]
        //     if (key == 'code' || key == 'message' || key == 'output') {
        //         return parsedData[key]
        //     }
        //     else if (key == "end_of_code") {
        //         return "\n"
        //     }
        //     else {
        //         // return empty string if key is not code, message, or output
        //         return ''
        //     }
        // }
        // catch (e) {
        //     console.log(e)
        //     return data
        // }
    }
}
