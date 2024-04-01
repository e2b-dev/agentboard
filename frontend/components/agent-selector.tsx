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
import { useAgent } from '@/lib/hooks/use-agent'
import { Agents, getInitials, Models } from '@/lib/agents'

function enumKeys<O extends object, K extends keyof O = keyof O>(obj: O): K[] {
  return Object.keys(obj).filter(k => !Number.isNaN(k)) as K[]
}

const AgentModelChoice = ({
  agent,
  model
}: {
  agent: string
  model: string
}) => {
  return (
    <div>
      <span className="sm:hidden">
        {agent} / {model}
      </span>
      <span className="hidden sm:block">
        {agent} / {model}
      </span>
    </div>
  )
}

export const AgentSelector = () => {
  const { agent, model, setAgent, setModel } = useAgent()
  const choices = []
  for (const agent of enumKeys(Agents)) {
    for (const model of enumKeys(Models)) {
      choices.push(
        <DropdownMenuItem
          key={`${agent}-${model}`}
          onClick={() => {
            setAgent(agent)
            setModel(model)
          }}
        >
          <AgentModelChoice agent={Agents[agent]} model={Models[model]} />
        </DropdownMenuItem>
      )
    }
  }

  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="px-0">
            <div className="flex shrink-0 select-none items-center justify-center rounded-full text-xs font-medium text-muted-foreground">
              <span className="sm:hidden">
                {getInitials(Agents[agent])} / {Models[model]}
              </span>
              <span className="hidden sm:block">
                {Agents[agent]} / {Models[model]}
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
          {choices}
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
