
import { Sandbox }  from '@e2b/sdk'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
export async function GET() {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({cookies: () => cookieStore})

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return new Response(JSON.stringify({error: 'Unauthorized'}), {
            status: 401
        })
    }

    if(process.env.DOCKER == 'local'){

        return new Response(JSON.stringify({ sandboxID: 'dummySandboxID' }), {
            headers: {
                'Content-Type': 'application/json'
            },
            status: 200
        })
    }
    else{
        try {
            let sandbox
            if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
                sandbox = await Sandbox.create({ 
                    template: 'e2b-ois-image-dev',
                    cwd: '/code',
                })
                await sandbox.keepAlive(1 * 60 * 1000) 
            }
            else {
                sandbox = await Sandbox.create({ 
                    template: 'e2b-ois-image',
                    cwd: '/code',
                })
                await sandbox.keepAlive(3 * 60 * 1000) 
            }

            await sandbox.process.start({
                cmd: `uvicorn server:app --host 0.0.0.0 --port 8080 && chmod 700 server.py`,
                cwd: '/code',
            })
            

            await new Promise(resolve => setTimeout(resolve, 3000));


            await sandbox.close()
            return new Response(JSON.stringify({ sandboxID: sandbox.id }), {
                headers: {
                    'Content-Type': 'application/json'
                },
                status: 200
            })
        }
        catch (e){
            return new Response(JSON.stringify({error: 'Unexpected error when calling /create-sandbox'}), {
                status: 500
            })
        }

    }

}