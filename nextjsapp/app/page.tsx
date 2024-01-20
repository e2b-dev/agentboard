import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AnonShield } from '@/components/anon-shield'

export default async function IndexPage() {

  // check if there is a session - if not, render the Anon Shield
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const {data: {session}} = await supabase.auth.getSession()

  const id = nanoid()

  return (
    <>
      {!session && <AnonShield/>}
      <Chat id={id} loggedIn={!!session}/>
    </>
  )
}
