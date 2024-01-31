import { AIStream, StreamingTextResponse } from 'ai'
import { Sandbox } from '@e2b/sdk'
import { parseOpenInterpreterStream } from '@/lib/stream-parsers'
import { nanoid } from 'nanoid'
import { createClient } from "@/utils/supabase/server";
import { cookies } from 'next/headers';
import PostHogClient from '@/utils/posthog/server'

// export const runtime = 'edge'

export async function POST(req: Request) {
    const json = await req.json()
    const { messages, sandboxID } = json

    let latestMessage = messages[messages.length - 1].content

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // only allow authorized users
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.log("User not authenticated")
        return new Response('Unauthorized', {
            status: 401
        })
    }
    const userId = user.id

    // record message user sends to analytics
    const posthog = PostHogClient()
    posthog.capture({
        distinctId: userId,
        event: 'chat_message_sent',
        properties: {
            message: latestMessage
        }
    })

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
                message: latestMessage,
            })
        })

        const stream = AIStream(res, parseOpenInterpreterStream())

        return new StreamingTextResponse(stream)
    
    }

    else {
        try {
            console.log(`User ${user.email} sent ${latestMessage} to sandbox id ${sandboxID}`)
            const sandbox = await Sandbox.reconnect(sandboxID) 
            await sandbox.keepAlive(5 * 60 * 1000) 

            const url = "https://" + sandbox.getHostname(8080)

            const res = await fetch(url + '/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    message: latestMessage,
                })
            })
            
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
