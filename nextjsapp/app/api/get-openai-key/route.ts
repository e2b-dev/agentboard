import { auth } from '@/auth'
import { kv } from '@vercel/kv'

export async function GET() {

    console.log('GET /api/get-openai-key')
    
    const userId = (await auth())?.user.id
    if (!userId) {
        return new Response('Unauthorized', {
            status: 401
        })
    }
    
    try {
        const key = await kv.hgetall(`user:openai-key:${userId}`)
        return new Response(JSON.stringify({ key }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    }
    catch (error) {
        console.log('GET /api/get-openai-key error', error)
        return new Response(JSON.stringify({ key: null }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}