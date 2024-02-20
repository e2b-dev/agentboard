import { AIStream, StreamingTextResponse } from 'ai'
import { Sandbox } from 'e2b'
import { parseOpenInterpreterStream } from '@/lib/stream-parsers'
import { nanoid } from 'nanoid'
import { createClient } from "@/utils/supabase/server";
import { cookies } from 'next/headers';
import PostHogClient from '@/utils/posthog/server'

// export const runtime = 'edge'

export async function POST(req: Request) {
    const json = await req.json()
    const { message, sandboxID } = json

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
            message: message
        }
    })

    // Require e2b sandbox if we're in production (local development doesn't require a sandbox) 
    if(process.env.NODE_ENV === 'production' || process.env.DOCKER === 'e2b') {
        if(!sandboxID) {
            return new Response('Sandbox ID required', {
                status: 400
            })
        }
    }

    try {
        const sandbox = await Sandbox.reconnect(sandboxID) 
        await sandbox.keepAlive(5 * 60 * 1000) 

        const url = "https://" + sandbox.getHostname(8080)

        const res = await fetch(url + '/add_message_no_chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                message: message,
            })
        })

        if (res.status !== 200) {
            return new Response('Unexpected error', {
                status: 500
            })
        }
        else {
            return new Response('Message sent', {
                status: 200
            })
        }
    } catch (e) {
        console.log(e)
        return new Response('Unexpected error', {
            status: 500
        })
    }
}