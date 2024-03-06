import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AnonShield } from '@/components/anon-shield'
import PostHogClient from '@/utils/posthog-server'

export default async function IndexPage() {

  // check if there is a session - if not, render the Anon Shield
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const {data: {session}} = await supabase.auth.getSession()
  const posthog = PostHogClient()
  if(!session) {
    console.log("Capturing anon page view")
    posthog.capture({
      distinctId: 'anon',
      event: 'page_view',
    })
  }
  else {
    console.log("Capturing page view for user ", session.user.id)
    posthog.capture({
      distinctId: session.user.id,
      event: 'page_view',
    })
  }

  const id = nanoid()

  return (
    <>
      {!session && <AnonShield/>}
      <Chat id={id} session={session ?? undefined}/>
    </>
  )
}
