'use client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { IconChevronUpDown } from '@/components/ui/icons'
import { ExternalLink } from './external-link'

export const AgentSelector = () => {
  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="px-0">
            <div className="flex shrink-0 select-none items-center justify-center rounded-full text-xs font-medium text-muted-foreground">
              <span className="sm:hidden">OI / GPT-3.5</span>
              <span className="hidden sm:block">
                Open Interpreter / GPT-3.5
              </span>
            </div>
            <IconChevronUpDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          sideOffset={8}
          align="start"
          className="w-[180px]"
          onCloseAutoFocus={e => e.preventDefault()}
        >
          <DropdownMenuItem className="flex-col items-start">
            <div className="text-xs text-zinc-500">More coming soon...</div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-xs">
            <ExternalLink href="https://twitter.com/e2b_dev">
              Request a new agent
            </ExternalLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
