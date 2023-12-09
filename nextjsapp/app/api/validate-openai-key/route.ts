import { OpenAI } from 'openai'
import { auth } from '@/auth'

export const runtime = 'edge'


export async function POST(req: Request) {
    console.log('POST /api/validate-openai-key')
    const json = await req.json()
    const { key } = json

    // Auth logic - delete later
    const userId = (await auth())?.user.id
    if (!userId) {
        return new Response('Unauthorized', {
            status: 401
        })
    }
    // end delete later

    const openai = new OpenAI({
        apiKey: key
    })

    try {
        await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {role: 'system', content: 'You are a helpful assistant'},
                {role: 'user', content: 'This is a test'},
            ],
            max_tokens: 5
        });
        
        console.log('POST /api/validate-openai-key valid key')
        return new Response(JSON.stringify({ valid: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        console.log('POST /api/validate-openai-key invalid key')
        return new Response(JSON.stringify({ valid: false }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
