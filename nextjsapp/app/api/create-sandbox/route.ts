
import { Sandbox }  from '@e2b/sdk'
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

            /*
            Google Cloud Run gets "warmed up" when it receives a request, so we send a dummy request to the API to speed up the first 
            actual request the user makes after the sandbox is finished starting
            */
            fetch('https://proxy-rotps5n5ja-uc.a.run.app/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{
                        content: 'This is a test, respond with Hello',
                        role: 'user'
                    }],
                    max_tokens: 10
                })
            }).then(response => response.json())
              .then(data => console.log(data))
              .catch(error => console.error('Error:', error));


            let sandbox
            if (process.env.NODE_ENV === 'development') {
                sandbox = await Sandbox.create({ 
                    template: 'e2b-ois-image-dev',
                })
                await sandbox.keepAlive(5 * 60 * 1000) 
            }
            else {
                sandbox = await Sandbox.create({ 
                    template: 'e2b-ois-image',
                })
                await sandbox.keepAlive(5 * 60 * 1000) 
            }

            await sandbox.process.start({
                cmd: `uvicorn --app-dir /code server:app --host 0.0.0.0 --port 8080`,
            })
            
            await new Promise(resolve => setTimeout(resolve, 3000));

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

}