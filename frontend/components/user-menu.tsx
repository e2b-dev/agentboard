'use client'

import Image from 'next/image'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface User {
  user_metadata: { avatar_url?: string; name?: string }
  email?: string
}

function getUserInitials(name: string) {
  const [firstName, lastName] = name.split(' ')
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName.slice(0, 2)
}
;``
export function UserMenu({ user }: { user: User }) {
  const supabase = createClient()
  const router = useRouter()

  const formatNameForMobile = (name: string) => {
    const firstName = name.split(' ')[0]
    return firstName.length > 8 ? `${firstName.slice(0, 8)}...` : firstName
  }

  const user_data = user.user_metadata
  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="px-0">
            {user?.user_metadata?.avatar_url ? (
              <Image
                className="mr-2 h-6 w-6 select-none rounded-full ring-1 ring-zinc-100/10 transition-opacity duration-300 hover:opacity-80"
                src={
                  user_data.avatar_url
                    ? `${user_data.avatar_url}`
                    : 'https://www.gravatar.com/avatar'
                }
                alt={user_data.name ?? 'Avatar'}
                height={48}
                width={48}
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-muted/50 text-xs font-medium uppercase text-muted-foreground">
                {user_data.name ? getUserInitials(user_data.name) : null}
              </div>
            )}
            <span className="ml-1 inline sm:hidden">
              {user_data.name ? formatNameForMobile(user_data.name) : null}
            </span>
            <span className="ml-1 hidden sm:block">{user_data.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start" className="w-[180px]">
          <DropdownMenuItem className="flex-col items-start">
            <div className="text-xs font-medium">{user_data.name}</div>
            <div className="text-xs text-zinc-500">{user.email}</div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              supabase.auth.signOut().then(() => {
                router.push('/')
                router.refresh()
              })
            }
            className="text-xs"
          >
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
