import { Sandbox } from 'e2b'
import { Writable, pipeline } from 'stream'
import { promisify } from 'util'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const supabase = createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  let sandbox
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const fileName = formData.get('fileName') as string
    const sandboxID = formData.get('sandboxID')

    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400
      })
    }
    if (!sandboxID || typeof sandboxID !== 'string') {
      return new Response(JSON.stringify({ error: 'No sandbox ID provided' }), {
        status: 400
      })
    }

    const fileBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(fileBuffer)

    sandbox = await Sandbox.reconnect(sandboxID)
    await sandbox.keepAlive(3 * 60 * 1000)
    const remotePath = await sandbox.uploadFile(buffer, fileName)
    console.log(
      `The file was uploaded to '${remotePath}' path inside the sandbox `
    )
    console.log('/upload-file written to E2B filesystem')

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (e) {
    console.log(e)
    return new Response("Unexpected error, couldn't upload file", {
      status: 500
    })
  } finally {
    if (sandbox) {
      await sandbox.close()
    }
  }
}
