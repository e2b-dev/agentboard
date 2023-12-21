
import { Sandbox }  from'@e2b/sdk'
import { auth } from '@/auth'

export async function GET() {
    
    const userId = (await auth())?.user
    if (!userId) {
        return new Response(JSON.stringify({error: 'Unauthorized'}), {
            status: 401
        })
    }

    const apiKey = process.env.OPENAI_API_KEY 

    let data;
    if(process.env.DOCKER == 'local'){
        const res = await fetch('http://localhost:8080/create-sandbox', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ apiKey: apiKey })
        })
        data = await res.json()

        if (data.status === "success") {
            return new Response(JSON.stringify({ sandboxID: 'dummySandboxID' }), {
                headers: {
                    'Content-Type': 'application/json'
                },
                status: 200
            })
        }
        else{
            console.log(data)
            return new Response('Unexpected error when calling /create-sandbox', {
                status: 500
            })
        }
    }
    else{
        let sandbox
        if (process.env.NODE_ENV === 'development') {
            sandbox = await Sandbox.create({ 
                template: 'e2b-ois-image-dev',
            })
            console.log("/api/create-sandbox sandbox id: " + sandbox.id)
            await sandbox.keepAlive(1 * 60 * 1000) 
        }
        else {
            sandbox = await Sandbox.create({ 
                template: 'e2b-ois-image',
            })
            await sandbox.keepAlive(3 * 60 * 1000) 
        }

        await sandbox.process.start({
            cmd: `uvicorn server:app --host 0.0.0.0 --port 8080 && chmod 700 server.py`,
            cwd: '/code',
        })

        await new Promise(resolve => setTimeout(resolve, 1000));

        const url = "https://" + sandbox.getHostname(8080)
        const res = await fetch(url + '/create-sandbox', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ apiKey: apiKey })
        })

        data = await res.json()
        await sandbox.close()
        if (data.status === "success") {
            return new Response(JSON.stringify({ sandboxID: sandbox.id }), {
                headers: {
                    'Content-Type': 'application/json'
                },
                status: 200
            })
        }
        else{
            console.log(data)
            return new Response('Unexpected error when calling /create-sandbox', {
                status: 500
            })
        }

    }
    
                
    


}