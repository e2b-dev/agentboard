import { Sandbox } from '@e2b/sdk'

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
export async function POST(req: Request) {

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({cookies: () => cookieStore})
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return new Response('Unauthorized', {
            status: 401
        })
    }

    const json = await req.json()
    const { sandboxID, fileName } = json

    console.log("filename: " + fileName)
    console.log("sandboxID: " + sandboxID)
    const filepath = fileName.split(":")[1]

    const sandbox = await Sandbox.reconnect(sandboxID)
    const buffer = await sandbox.downloadFile(filepath) 

    return new Response(buffer, {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename=${fileName}`
        }
    })
}