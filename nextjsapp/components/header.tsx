import * as React from 'react'
import { UserMenu } from '@/components/user-menu'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function Header() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 flex items-center w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-start w-1/2 sm:w-1/3">
        <div className="flex items-center">
          {user && <UserMenu user={user} />}
        </div>
      </div>
      <div className="flex items-center justify-center w-1/3">
        <div className="text-lg font-bold">Agentboard</div>
      </div>
      <div className="flex sm:hidden items-end justify-end w-1/3 mr-4"></div>
    </header>
  )
}
