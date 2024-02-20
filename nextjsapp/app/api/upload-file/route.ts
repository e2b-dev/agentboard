import { Sandbox } from 'e2b'
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

    console.log("Attempting to /upload-file")
    let sandbox
    try {
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
        sandbox = await Sandbox.reconnect(sandboxID) 
        await sandbox.keepAlive(3 * 60 * 1000) 
        const remotePath = await sandbox.uploadFile(buffer, fileName)
        console.log(`The file was uploaded to '${remotePath}' path inside the sandbox `)
        console.log("/upload-file written to E2B filesystem")

        // Send message to add_message_no_chat
        const endpoint = process.env.NODE_ENV === 'production' ? 'http://35.222.184.99/add_message_no_chat' : 'http://localhost:8080/add_message_no_chat'
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Uploaded ${fileName} ✅`
            })
        })

        if(!res.ok) {
            console.log("Failed to send message to add_message_no_chat")
            return new Response('Failed to add message to message history', {
                status: 500
            })
        }

        return new Response(JSON.stringify({success: true}), {status: 200})
    }
    catch (e) {
        console.log(e)
        return new Response('Unexpected error', {
            status: 500
        })
    }
    finally {
        if(sandbox) {
            await sandbox.close()
        }
    }
}

