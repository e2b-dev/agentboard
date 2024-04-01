import { createClient } from '@/utils/supabase/server'
import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AnonShield } from '@/components/anon-shield'
import PostHogClient from '@/utils/posthog-server'

export default async function IndexPage() {
  // check if there is a session - if not, render the Anon Shield
  const supabase = createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()
  const posthog = PostHogClient()
  if (!user) {
    posthog.capture({
      distinctId: 'anon',
      event: 'page_view'
    })
  } else {
    posthog.capture({
      distinctId: user.id,
      event: 'page_view'
    })
  }

  const id = nanoid()

  return (
    <>
      {!user && <AnonShield />}
      <Chat id={id} user={user ?? undefined} />
    </>
  )
}
