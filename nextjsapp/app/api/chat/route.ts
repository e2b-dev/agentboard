import { AIStream, StreamingTextResponse } from 'ai'
import { Sandbox } from '@e2b/sdk'
import { auth } from '@/auth'
import { parseOpenInterpreterStream } from '@/lib/stream-parsers'
import { kv } from '@vercel/kv'
import { nanoid } from 'nanoid'

export const runtime = 'edge'

export async function POST(req: Request) {
    const json = await req.json()
    const { messages, sandboxID } = json

    let latestMessage = messages[messages.length - 1].content

    const userId = (await auth())?.user
    if (!userId) {
        console.log("User not authenticated")
        return new Response('Unauthorized', {
            status: 401
        })
    }
    let endTime = Date.now()

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
            body: JSON.stringify({ 
                chat_message: {message: latestMessage},
                openai_api_key: { apiKey: process.env.OPENAI_API_KEY }
            })
        })
        endTime = Date.now()

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
                body: JSON.stringify({ 
                    chat_message: {message: latestMessage},
                    openai_api_key: { apiKey: process.env.OPENAI_API_KEY }
                })
            })
            endTime = Date.now()
            
            const stream = AIStream(res, parseOpenInterpreterStream(), {
                async onFinal(completion){
                    await sandbox.close()
                },
                async onCompletion(completion) {
                    const title = json.messages[0].content.substring(0, 100)
                    const id = json.id ?? nanoid()
                    const createdAt = Date.now()
                    const path = `/chat/${id}`
                    const payload = {
                      id,
                      title,
                      userId,
                      createdAt,
                      path,
                      messages: [
                        ...messages,
                        {
                          content: completion,
                          role: 'assistant'
                        }
                      ]
                    }
                    await kv.hmset(`chat:${id}`, payload)
                    await kv.zadd(`user:chat:${userId}`, {
                      score: createdAt,
                      member: `chat:${id}`
                    })
                  }
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
