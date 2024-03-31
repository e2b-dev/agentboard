import { Sandbox } from 'e2b'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

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

  const json = await req.json()
  const { sandboxID, filePath } = json

  console.log('filePath: ' + filePath)
  console.log('sandboxID: ' + sandboxID)

  let sandbox: Sandbox | undefined
  try {
    sandbox = await Sandbox.reconnect(sandboxID)

    const buffer = await sandbox.downloadFile(filePath)

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename=${filePath}`
      }
    })
  } finally {
    if (sandbox) {
      await sandbox.close()
    }
  }
}