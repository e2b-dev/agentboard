import * as React from 'react'
import { UserMenu } from '@/components/user-menu'
import { createClient } from '@/utils/supabase/server'
import { AgentSelector } from '@/components/agent-selector'
import { IconAgentboard } from '@/components/ui/icons'

export async function Header() {
  const supabase = createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center border-b bg-gradient-to-b from-background/10 via-background/50 to-background/80 px-4 backdrop-blur-xl">
      <div className="flex w-1/3 items-center justify-start">
        <div className="flex items-center">
          {user && <UserMenu user={user} />}
        </div>
      </div>
      <div className="flex w-1/3 items-center justify-center">
        <div className="text-lg font-bold">
          <a className="flex items-center justify-center" href="/">
            <IconAgentboard className="m-1" />
            Agentboard
          </a>
        </div>
      </div>
      <div className="flex w-1/3 items-end justify-end sm:mr-4">
        <AgentSelector />
      </div>
    </header>
  )
}
