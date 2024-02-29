import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    heading: 'Get the local time in Seattle',
    message: `What is the current time in Seattle?`
  },
  {
    heading: 'Convert an image file',
    message: 'Convert the image /home/user/agentboard-example.jpg to a png'
  },
  {
    heading: 'Get audio from a YouTube video',
    message: `Can you extract the audio from this youtube video for me? https://www.youtube.com/watch?v=WTOm65IZneg`
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
          Agentboard is the easiest way to use an AI agent in the browser.
        </p>
        <p className="mb-2 leading-normal text-muted-foreground">
          In other words: it will attempt write AND execute code to accomplish tasks.
        </p>
        <p className="mb-2 leading-normal text-muted-foreground">
          Users find Agentboard most useful for CSV analysis, image manipulation, and web scraping.
        </p>
        <p className="mb-2 leading-normal text-muted-foreground">
          Try one of the following examples:
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