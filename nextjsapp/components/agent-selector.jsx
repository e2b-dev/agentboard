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
                <Button variant="ghost" className="pl-0 px-0">
                    <div className="flex items-center justify-center text-xs font-medium rounded-full select-none shrink-0 text-muted-foreground">
                    <span className="sm:hidden">OI / GPT-4</span>
                    <span className="hidden sm:block">Open Interpreter / GPT-4</span>
                    </div>
                    <IconChevronUpDown className="w-4 h-4 ml-2" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                sideOffset={8}
                align="start"
                className="w-[180px]"
                onCloseAutoFocus={(e) => e.preventDefault()}
                >
                <DropdownMenuItem className="flex-col items-start">
                <div className="text-xs text-zinc-500">More coming soon...</div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                className="text-xs"
                >
                <ExternalLink href="https://twitter.com/aamir1rasheed" target="_blank" rel="noopener noreferrer">
                Request a new agent 
                </ExternalLink>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}


