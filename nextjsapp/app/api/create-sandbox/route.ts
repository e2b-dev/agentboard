
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
        let sandbox = await Sandbox.create({
            template: 'ois-code-execution-sandbox',
            metadata: { userID: user.id }
        })
        if (process.env.NODE_ENV === 'development') {
            await sandbox.keepAlive(5 * 60 * 1000) // 5 minutes 
        }
        else {
            await sandbox.keepAlive(60 * 60 * 1000) // 1 hour
        }

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