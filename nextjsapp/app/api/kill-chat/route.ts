import { Sandbox } from 'e2b'
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return new Response('Unauthorized', {
            status: 401
        })
    }

    let res;
    // Check if the environment is development or production
    if (process.env.NODE_ENV === 'development' && process.env.DOCKER === 'local') {
        // call local docker container
        try {
            res = await fetch('http://localhost:8080/killchat')

        }
        catch (e) {
            console.log(e)
            return new Response(`Unexpected error: ${(e as Error).message}`, {
                status: 500
            })
        }

    } else {
        const json = await req.json()
        const { sandboxID } = json
        
        if(!sandboxID) {
            return new Response('Sandbox ID required', {
                status: 400
            })
        }
        try {
            const sandbox = await Sandbox.reconnect(sandboxID) 
            await sandbox.keepAlive(3 * 60 * 1000) 

            const url = "https://" + sandbox.getHostname(8080)
            console.log("/api/kill-chat fetching url: " + url + "/killchat")
            res = await fetch(url + '/killchat')

        }
        catch (e) {
            console.log(e)
            return new Response('Unexpected error', {
                status: 500
            })
        }

    }
    const data = await res.json()
    if (data.status === "Chat process terminated") {
        return new Response('Chat process terminated', {
            status: 200
        })
    }
    else{
        console.log(data)
        return new Response('Unexpected error when calling /killchat', {
            status: 500
        })
    }

}
