import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'

export default async function IndexPage() {

  // protect route for authenticated users only
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const {data: {session}} = await supabase.auth.getSession()
  if (!session) {
    redirect('/sign-in')
  }

  const id = nanoid()

  return <Chat id={id} />
}
