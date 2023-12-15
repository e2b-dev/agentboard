import { AIStream, StreamingTextResponse } from 'ai'
import { Sandbox } from '@e2b/sdk'
import { auth } from '@/auth'
import { parseOpenInterpreterStream } from '@/lib/stream-parsers'

export const runtime = 'edge'

export async function POST(req: Request) {
    const json = await req.json()
    // const { messages, previewToken, sandboxID } = json
    const { messages, sandboxID } = json

    let latestMessage = messages[messages.length - 1].content

    const userId = (await auth())?.user.id
    if (!userId) {
        console.log("User not authenticated")
        return new Response('Unauthorized', {
            status: 401
        })
    }

    // Sandbox not required for local development
    if(process.env.NODE_ENV === 'production' || process.env.DOCKER === 'e2b') {
        if(!sandboxID) {
            return new Response('Sandbox ID required', {
                status: 400
            })
        }
    }

    if (process.env.DOCKER === 'local') {
        // call local docker container
        const res = await fetch('http://localhost:8080/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: latestMessage })
        })

        const stream = AIStream(res, parseOpenInterpreterStream())

        return new StreamingTextResponse(stream)
    
    }

    else {
        try {
            const sandbox = await Sandbox.reconnect(sandboxID) 
            await sandbox.keepAlive(3 * 60 * 1000) 

            const url = "https://" + sandbox.getHostname(8080)

            const res = await fetch(url + '/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: latestMessage })
            })
            
            const stream = AIStream(res, parseOpenInterpreterStream(), {
                async onFinal(completion){
                    await sandbox.close()
                },
            })

            return new StreamingTextResponse(stream)
        }
        catch (e) {
            console.log(e)
            return new Response('Sandbox not found, this is error', {
                status: 500
            })
        }

    }

}
