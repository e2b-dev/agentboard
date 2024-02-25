import {type AIStreamParser} from 'ai'

export function parseOpenInterpreterStream(): AIStreamParser {
    return (data: string) => {
        // decode the urllencoded data from server
        // it was urllencoded to prevent issues with the newlines and colon characters
        const formattedData = decodeURIComponent(data)
        
        return formattedData
    }
}
