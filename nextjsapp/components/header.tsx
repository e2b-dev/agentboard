import * as React from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  IconNextChat, IconSeparator,
} from '@/components/ui/icons'
import { UserMenu } from '@/components/user-menu'
import { ExternalLink } from '@/components/external-link'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'


export async function Header() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 flex items-center w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-start w-1/2 sm:w-1/3">
        {/* {user ? (
          <></>
          // <Sidebar>
          //   <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          //     <SidebarList userId={session?.user?.id} />
          //   </React.Suspense>
          //   <SidebarFooter>
          //     <ThemeToggle />
          //     <ClearHistory clearChats={clearChats} />
          //   </SidebarFooter>
          // </Sidebar>
        ) : (
          <Link href="/" target="_blank" rel="nofollow">
            <IconNextChat className="w-6 h-6 mr-2 dark:hidden" inverted />
            <IconNextChat className="hidden w-6 h-6 mr-2 dark:block" />
          </Link>
        )} */}
        <div className="flex items-center">
          {/* <IconSeparator className="w-6 h-6 text-muted-foreground/50" /> */}
          {/* {user ? (
            <UserMenu user={user} />
          ) : (
            <Button variant="link" asChild className="-ml-2">
              <Link href="/sign-in?callbackUrl=/">Login</Link>
            </Button>
          )} */}
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
