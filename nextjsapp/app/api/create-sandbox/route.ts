
import { Sandbox }  from'@e2b/sdk'
import { auth } from '@/auth'

export async function GET() {
    if(process.env.DOCKER == 'local'){
        // no need for sandbox, just return local
        return new Response(JSON.stringify({sandboxID: "dummy-sandbox-id-to-make-it-work"}), {
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }
    const userId = (await auth())?.user
    if (!userId) {
        return new Response(JSON.stringify({error: 'Unauthorized'}), {
            status: 401
        })
    }

    const apiKey = process.env.OPENAI_API_KEY 
    
    let sandbox
    if (process.env.NODE_ENV === 'development') {
        sandbox = await Sandbox.create({ 
            template: 'e2b-ois-image-dev',
        })
        console.log("/api/create-sandbox sandbox id: " + sandbox.id)
    }
    else {
        sandbox = await Sandbox.create({ 
            template: 'e2b-ois-image',
        })
    }
    await sandbox.process.start({
        cmd: `OPENAI_API_KEY=${apiKey} uvicorn server:app --host 0.0.0.0 --port 8080`,
        cwd: '/code',
    })

    await sandbox.keepAlive(3 * 60 * 1000) 

    console.log("Waiting 1 second to let server finish starting")
    await new Promise(resolve => setTimeout(resolve, 1000));

    await sandbox.close()

    return new Response(JSON.stringify({ sandboxID: sandbox.id }), {
        headers: {
            'Content-Type': 'application/json'
        }
    })
}