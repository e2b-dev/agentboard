import { auth } from '@/auth'
import { kv } from '@vercel/kv'

export async function POST(req: Request) {
    console.log('POST /api/save-openai-key')

    const userId = (await auth())?.user.id
    if (!userId) {
        return new Response('Unauthorized', {
            status: 401
        })
    }

    const json = await req.json()
    const { key } = json

    try {
        await kv.hmset(`user:openai-key:${userId}`, {key: key})
        console.log('POST /api/save-openai-key key saved', key)
        return new Response(JSON.stringify({ message: 'Key saved successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        console.log('POST /api/save-openai-key error', error)
        return new Response('Failed to save key', {
            status: 500
        })
    }

}