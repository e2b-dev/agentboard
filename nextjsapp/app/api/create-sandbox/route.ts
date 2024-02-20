
import { Sandbox }  from 'e2b'
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server'

export async function GET() {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return new Response(JSON.stringify({error: 'Unauthorized'}), {
            status: 401
        })
    }

    try {  
        // connect to existing sandbox or create a new one
        let sandbox;
        const runningSandboxes = await Sandbox.list()
        const found = runningSandboxes.find(s => s.metadata?.userID === user.id)
        if (found) {
            // Sandbox found, we can reconnect to it
            sandbox = await Sandbox.reconnect(found.sandboxID)
        } else {
            // Sandbox not found, create a new one
            sandbox = await Sandbox.create({
                template: 'ois-code-execution-sandbox',
                metadata: { userID: user.id }
            })
        }

        // 5 minutes in development, 1 hour in production
        await sandbox.keepAlive(process.env.NODE_ENV === 'development' ? 5 * 60 * 1000 : 60 * 60 * 1000) 

        await sandbox.close()

        console.log("Sandbox created, id: ", sandbox.id)
        return new Response(JSON.stringify({ sandboxID: sandbox.id }), {
            headers: {
                'Content-Type': 'application/json'
            },
            status: 200
        })
    }
    catch (e){
        return new Response((JSON.stringify(e)), {
            status: 500
        })
    }

}