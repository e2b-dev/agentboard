import { AIStream, StreamingTextResponse } from 'ai'
import { parseOpenInterpreterStream } from '@/lib/stream-parsers'
import { createClient } from "@/utils/supabase/server";
import { cookies } from 'next/headers';
import PostHogClient from '@/utils/posthog/server'

// export const runtime = 'edge'

export async function POST(req: Request) {
    const json = await req.json()
    const {messages} = json

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

    // record message user sends to analytics
    const posthog = PostHogClient()
    posthog.capture({
        distinctId: user.id,
        event: 'chat_message_sent',
        properties: {
            message: latestMessage
        }
    })

    // make call to the server
    try {
        const endpoint = process.env.NODE_ENV === 'production' ? 'http://35.222.184.99/chat' : 'http://localhost:8080/chat'
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                messages: messages,
                user_id: user.id
            })
        })
        
        const stream = AIStream(res, parseOpenInterpreterStream())

        return new StreamingTextResponse(stream)
    }
    catch (e) {
        console.log(e)
        return new Response('Sandbox not found, this is error', {
            status: 500
        })
    }

}
