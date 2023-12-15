import { auth } from '@/auth'

import { Sandbox } from '@e2b/sdk'

export async function POST(req: Request) {

    const userId = (await auth())?.user.id
    if (!userId) {
        return new Response('Unauthorized', {
            status: 401
        })
    }

    let res;
    // Check if the environment is development or production
    if (process.env.NODE_ENV === 'development') {
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
        const json = await req.json()
        const { sandboxID } = json
        
        if(!sandboxID) {
            return new Response('Sandbox ID required', {
                status: 400
            })
        }
        try {
            const sandbox = await Sandbox.reconnect(sandboxID) 
            await sandbox.keepAlive(3 * 60 * 1000) 

            const url = "https://" + sandbox.getHostname(8080)

            const res = await fetch(url + '/killchat', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            })

            // if response successful, return response
            if (res.ok) {
                return res
            } else {
                // else return error
                return new Response('Error while calling stopping chat', {
                    status: 500
                })
            }
            
        }
        catch (e) {
            console.log(e)
            return new Response('Sandbox not found', {
                status: 500
            })
        }

    }

}
