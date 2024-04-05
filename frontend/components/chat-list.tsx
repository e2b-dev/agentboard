import { type Message } from 'ai'

import { Separator } from '@/components/ui/separator'
import { ChatMessage } from '@/components/chat-message'
import { IconSpinner } from '@/components/ui/icons'
import { AgentsEnum } from '@/lib/agents'

export interface ChatList {
  messages: Message[]
  agentType: AgentsEnum
  handleSandboxLink: (link: string) => void
  isLoading: boolean
}

export function ChatList({
  messages,
  handleSandboxLink,
  agentType,
  isLoading
}: ChatList) {
  if (!messages.length) {
    return null
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {messages.map((message, index) => (
        <div key={index}>
          <ChatMessage
            message={message}
            agentType={agentType}
            handleSandboxLink={handleSandboxLink}
          />
          {index < messages.length - 1 && (
            <Separator className="my-4 md:my-8" />
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex items-center justify-center">
          <IconSpinner />
        </div>
      )}
    </div>
  )
}
