import { auth } from '@/auth'

export const runtime = 'edge'


export async function GET() {

    const userId = (await auth())?.user.id
    if (!userId) {
        return new Response('Unauthorized', {
            status: 401
        })
    }


    let res;
    // Check if the environment is development or production
    if (process.env.NODE_ENV === 'development') {
        console.log("Calling development kill-chat")
        // call local docker container
        res = await fetch('http://localhost:8080/killchat', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        })
        // print response
        const res_json = await res.json()
        console.log(res_json)

        return res
        

    } else {
        console.log("Calling production kill-chat")

    }

}
