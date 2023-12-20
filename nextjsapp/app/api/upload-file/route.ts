import { AIStream, StreamingTextResponse } from 'ai'
import { Sandbox } from '@e2b/sdk'
import { auth } from '@/auth'
import { Readable, Writable, pipeline } from 'stream';
import { promisify } from 'util';

export const config = {
    api: {
      bodyParser: false, // Disabling Next.js's body parser as we will handle it
    },
  };

export async function POST(req: Request, res: Response) {
    const userId = (await auth())?.user
    if (!userId) {
        console.log("User not authenticated")
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
    const fileName = formData.get('fileName')
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

    const fileStream = file.stream();
    const getBuffer = promisify(pipeline);
    let fileBuffer = Buffer.alloc(0);

    await getBuffer(
        fileStream,
        new Writable({
            write(chunk, encoding, callback) {
                fileBuffer = Buffer.concat([fileBuffer, chunk]);
                callback();
            }
        })
    );


    const fileUint8Array = new Uint8Array(fileBuffer);
    console.log("File size in /upload-file: " + fileUint8Array.length + " bytes")

    const sandbox = await Sandbox.reconnect(sandboxID) 
    await sandbox.keepAlive(3 * 60 * 1000) 
    await sandbox.filesystem.writeBytes('/code/' + fileName, fileUint8Array)
    await sandbox.close()
    console.log("/upload-file written to E2B filesystem")
    
    return new Response(JSON.stringify({success: true}), {
        status: 200
    })
}