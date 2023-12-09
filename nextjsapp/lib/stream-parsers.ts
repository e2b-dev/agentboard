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
        // decode the urllencoded data from server
        // it was urllencoded to prevent issues with the newlines and colon characters
        const formattedData = decodeURIComponent(data)
        
        return formattedData
    }
}
