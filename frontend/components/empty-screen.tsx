import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    heading: 'Plot a graph of a TESLA stock',
    message: `Plot a graph of the TESLA stock performance for the last 30 days`
  },
  {
    heading: 'File conversion for an image',
    message: 'Download photo of the day from NASA website and convert the photo to a png'
  },
  {
    heading: 'Get audio from a YouTube video',
    message: `Extract the audio from this youtube video https://www.youtube.com/watch?v=dQw4w9WgXcQ`
  }
]

export function EmptyScreen({ setInput }: Pick<UseChatHelpers, 'setInput'>) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">Welcome to Agentboard!</h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          Agentboard is the easiest way to use an AI agent in the browser.
        </p>
        <p className="mb-2 leading-normal text-muted-foreground">
          Specify a task, and Agentboard will write and execute code to complete
          it.
        </p>
        <p className="mb-2 leading-normal text-muted-foreground">
          You&apos;ll find it useful for CSV analysis, image manipulation, or
          web scraping.
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
