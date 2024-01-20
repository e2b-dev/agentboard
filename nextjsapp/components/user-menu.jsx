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


function getUserInitials(name) {
  const [firstName, lastName] = name.split(' ')
  return lastName ? `${firstName[0]}${lastName[0]}` : firstName.slice(0, 2)
}

export function UserMenu({ user }) {
  const supabase = createClient()
  const router = useRouter()

  const user_data = user.user_metadata
  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="pl-0 px-0">
            {user?.user_metadata?.avatar_url ? (
              <Image
                className="w-6 h-6 transition-opacity duration-300 rounded-full select-none ring-1 ring-zinc-100/10 hover:opacity-80 mr-2"
                src={user_data.avatar_url ? `${user_data.avatar_url}` : 'https://www.gravatar.com/avatar'}
                alt={user_data.name ?? 'Avatar'}
                height={48} width={48}
              />
            ) : (
              <div className="flex items-center justify-center text-xs font-medium uppercase rounded-full select-none h-7 w-7 shrink-0 bg-muted/50 text-muted-foreground">
                {user_data.name ? getUserInitials(user_data.name) : null}
              </div>
            )}
            <span className="ml-2">{user_data.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start" className="w-[180px]">
          <DropdownMenuItem className="flex-col items-start">
            <div className="text-xs font-medium">{user_data.name}</div>
            <div className="text-xs text-zinc-500">{user_data.email}</div>
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
