import { kv } from '@vercel/kv'
import { AIStream, OpenAIStream, StreamingTextResponse } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'
import { parseOpenInterpreterStream } from '@/lib/stream-parsers'

export const runtime = 'edge'

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
})

const openai = new OpenAIApi(configuration)

export async function POST(req: Request) {
    const json = await req.json()
    const { messages, previewToken } = json

    let latestMessage = messages[messages.length - 1].content

    // Auth logic - delete later
    const userId = (await auth())?.user.id
    if (!userId) {
        return new Response('Unauthorized', {
            status: 401
        })
    }
    // end delete later

    // Alternative to openAI key - absolutely required for later
    if (previewToken) {
        configuration.apiKey = previewToken
    }

    let res;
    // Check if the environment is development or production
    if (process.env.NODE_ENV === 'development') {
        // call local docker container
        res = await fetch('http://localhost:8080/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: latestMessage })
        })

        const stream = AIStream(res, parseOpenInterpreterStream())

        return new StreamingTextResponse(stream)
        

    } else {
        // Code to run in production environment
        // calling OpenAI API
        res = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages,
            temperature: 0.7,
            stream: true
        })

        console.log(res)

        // Streaming response back to user and saving in KV
        const stream = OpenAIStream(res, {
            async onCompletion(completion) {
                console.log("completion: ", completion)
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

}
