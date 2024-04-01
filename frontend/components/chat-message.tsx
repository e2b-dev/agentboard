// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Chat/ChatMessage.tsx

import { Message } from 'ai'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '@/lib/utils'
import { CodeBlock } from '@/components/ui/codeblock'
import { MemoizedReactMarkdown } from '@/components/markdown'
import {
  IconOpenAI,
  IconUser,
  IconOpenInterpreter,
  IconDownload
} from '@/components/ui/icons'
import { ChatMessageActions } from '@/components/chat-message-actions'
import {AgentsEnum, ModelsEnum} from "@/lib/agents";

interface ChatMessageProps {
  message: Message
  agentType: AgentsEnum
  handleSandboxLink: (link: string) => void
}

export function ChatMessage({
  message,
  agentType,
  handleSandboxLink,
  ...props
}: ChatMessageProps) {
  return (
    <div
      className={cn('group relative mb-4 flex items-start md:-ml-12')}
      {...props}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
          message.role === 'user'
            ? 'bg-background'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {message.role === 'user' ? (
          <IconUser />
        ) : agentType === AgentsEnum.OpenInterpreter ? (
          <IconOpenInterpreter />
        ) : (
          <IconOpenAI />
        )}
      </div>
      <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
        <MemoizedReactMarkdown
          className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
          remarkPlugins={[remarkGfm, remarkMath]}
          transformLinkUri={uri => uri}
          components={{
            a({ children, href }) {
              if (href && href.includes('/home/user/')) {
                const extractedPath =
                  '/home/user/' + href.split('/home/user/')[1]
                return (
                  <button
                    onClick={() => handleSandboxLink(extractedPath)}
                    className="inline-flex items-center rounded-md bg-white px-2.5 py-0.5 text-sm font-medium text-black"
                  >
                    <IconDownload className="mr-1.5 h-5 w-5 text-black" />
                    {children}
                  </button>
                )
              }
              return <a href={href}>{children}</a>
            },
            p({ children }) {
              return <p className="mb-2 last:mb-0">{children}</p>
            },
            code({ node, inline, className, children, ...props }) {
              if (children.length) {
                if (children[0] == '▍') {
                  return (
                    <span className="mt-1 animate-pulse cursor-default">▍</span>
                  )
                }

                children[0] = (children[0] as string).replace('`▍`', '▍')
              }

              const match = /language-(\w+)/.exec(className || '')

              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ''}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              )
            }
          }}
        >
          {message.content}
        </MemoizedReactMarkdown>
        <ChatMessageActions message={message} />
      </div>
    </div>
  )
}
