import { Sandbox } from '@e2b/sdk'
import { Writable, pipeline } from 'stream';
import { promisify } from 'util';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return new Response('Unauthorized', {
            status: 401
        })
    }
    if (process.env.DOCKER === 'local') {
        console.log("/upload-file not implemented for local docker container")
        return new Response('Not implemented', {
            status: 501
        })
    }

    console.log("Attempting to /upload-file")
    const formData = await req.formData()
    const file = formData.get('file')
    const fileName = formData.get('fileName') as string
    const sandboxID = formData.get('sandboxID')

    if (!file || typeof file === 'string') {
        return new Response(JSON.stringify({error: "No file uploaded"}), {
            status: 400
        })
    }
    if (!sandboxID || typeof sandboxID !== 'string'){
        return new Response(JSON.stringify({error: "No sandbox ID provided"}), {
            status: 400
        })
    }

    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);
    const sandbox = await Sandbox.reconnect(sandboxID) 
    await sandbox.keepAlive(3 * 60 * 1000) 
    const remotePath = await sandbox.uploadFile(buffer, fileName)
    console.log(`The file was uploaded to '${remotePath}' path inside the sandbox `)
    await sandbox.close()
    console.log("/upload-file written to E2B filesystem")
    
    return new Response(JSON.stringify({success: true}), {
        status: 200
    })

}