import { auth } from '@/auth'
import { Sandbox } from '@e2b/sdk'

export async function POST(req: Request) {

    const user = (await auth())?.user
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