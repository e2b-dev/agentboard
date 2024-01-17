import * as React from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  IconNextChat, IconSeparator,
} from '@/components/ui/icons'
import { UserMenu } from '@/components/user-menu'
import { ExternalLink } from '@/components/external-link'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'


export async function Header() {
  const supabase = createServerComponentClient({cookies})

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 flex items-center w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-start w-1/3">
        {user ? (
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
        )}
        <div className="flex items-center">
          {/* <IconSeparator className="w-6 h-6 text-muted-foreground/50" /> */}
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Button variant="link" asChild className="-ml-2">
              <Link href="/sign-in?callbackUrl=/">Login</Link>
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center w-1/3">
        <span>using {' '}
        <ExternalLink href="https://openinterpreter.com/">
          <span className="text-center" style={{ fontFamily: 'system-ui' }}> Open Interpreter Project</span>
        </ExternalLink>
      </span>
      </div>
      <div className="flex items-center justify-end w-1/3"></div>
    </header>
  )
}
