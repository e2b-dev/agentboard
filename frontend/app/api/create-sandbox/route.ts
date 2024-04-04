import { Sandbox } from 'e2b'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401
    })
  }

  let sandbox
  try {
    // connect to existing sandbox or create a new one
    const runningSandboxes = await Sandbox.list()
    const found = runningSandboxes.find(s => s.metadata?.userID === user.id)
    if (found) {
      // Sandbox found, we can reconnect to it
      sandbox = await Sandbox.reconnect(found.sandboxID)
    } else {
      // Sandbox not found, create a new one
      sandbox = await Sandbox.create({
        template: 'code-interpreter-stateful',
        metadata: { userID: user.id }
      })
    }

    // 5 minutes in development, 10 mins in production
    await sandbox.keepAlive(
      process.env.NODE_ENV === 'development' ? 2 * 60 * 1000 : 10 * 60 * 1000
    )

    console.log('Sandbox created, id: ', sandbox.id)
    return new Response(JSON.stringify({ sandboxID: sandbox.id }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 200
    })
  } catch (e) {
    console.log('Error creating sandbox: ', e)
    return new Response(JSON.stringify(e), {
      status: 500
    })
  } finally {
    if (sandbox) {
      await sandbox.close()
    }
  }
}
