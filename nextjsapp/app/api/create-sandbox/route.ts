
import { Sandbox }  from'@e2b/sdk'
import { auth } from '@/auth'

export async function POST(req: Request) {
    const json = await req.json()
    const { apiKey } = json
    const userId = (await auth())?.user.id
    if (!userId) {
        return new Response('Unauthorized', {
            status: 401
        })
    }
    
    const sandbox = await Sandbox.create({ 
        template: 'e2b-ois-image',
    })

    await sandbox.process.start({
        cmd: `OPENAI_API_KEY=${apiKey} uvicorn server:app --host 0.0.0.0 --port 8080`,
        cwd: '/code',
    })

    await sandbox.keepAlive(5 * 60 * 1000) 
    const newSandboxID = sandbox.id

    console.log("Waiting 1 second to let server finish starting")
    await new Promise(resolve => setTimeout(resolve, 1000));

    await sandbox.close()

    return new Response(JSON.stringify({ sandboxID: newSandboxID }), {
        headers: {
            'Content-Type': 'application/json'
        }
    })
}