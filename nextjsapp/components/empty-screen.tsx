import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    heading: 'Find the current local time in Seattle',
    message: `What is the current time in Seattle?`
  },
  {
    heading: 'Summarize a Paul Graham article and write it to a file',
    message: 'Extract info from this webpage http://www.paulgraham.com/hs.html, then generate a summary for it and write it to a .txt. file. \n'
  },
  {
    heading: 'List all of the files in a directory',
    message: `List all the files in the current working directory \n`
  }
]

export function EmptyScreen({ setInput }: Pick<UseChatHelpers, 'setInput'>) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">
          Welcome to Agentboard!
        </h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          Agentboard is an easy way to try out AI agents from the comfort of the web.
          All agents run in sandboxed Docker containers and are completely ephemeral.
        </p>
        <p className="mb-2 leading-normal text-muted-foreground">For now, you can try <ExternalLink href="https://openinterpreter.com/"> Open Interpreter</ExternalLink>, with plans to
        expand to other AI agents such as <ExternalLink href="https://github.com/yoheinakajima/babyagi">BabyAGI</ExternalLink>
        in the future.</p> 
        <p className="leading-normal text-muted-foreground">
          You can start a conversation below or try the following examples:
        </p>
        <div className="mt-4 flex flex-col items-start space-y-2">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              onClick={() => setInput(message.message)}
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
