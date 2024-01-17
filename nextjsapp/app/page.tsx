import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'

export default async function IndexPage() {

  // protect route for authenticated users only
  const supabase = createServerComponentClient({cookies})
  const {data: {session}} = await supabase.auth.getSession()
  if (!session) {
    redirect('/sign-in')
  }

  const id = nanoid()

  return <Chat id={id} />
}
