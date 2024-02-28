import { UseChatHelpers } from 'ai/react'
import * as React from 'react'
import Textarea from 'react-textarea-autosize'

import { Button, buttonVariants } from '@/components/ui/button'
import { IconArrowElbow, IconSpinner, IconUpload } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { cn } from '@/lib/utils'

export interface PromptProps
  extends Pick<UseChatHelpers, 'input' | 'setInput' | 'handleSubmit' > {
  // onSubmit: (value: string) => Promise<void>
  fileUploadOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  fileUploading: boolean
  isLoading: boolean
  loggedIn: boolean
  sandboxID: string
}

export function PromptForm({
  handleSubmit, 
  input, 
  setInput, 
  isLoading,
  fileUploadOnChange,
  fileUploading,
  loggedIn,
  sandboxID
}: PromptProps) {
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  React.useEffect(() => {
    if (!fileUploading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [fileUploading])

  return (
    <form
      onSubmit={handleSubmit}
      ref={formRef}
    >
      <div className="relative flex flex-col">
        {process.env.NODE_ENV !== 'production' && (
          <div className="flex justify-center items-center pb-1">
            <p className="text-xs text-gray-500"><span style={{ display: 'inline-flex', alignItems: 'center' }}>
sandboxID: {sandboxID || <IconSpinner/>}</span></p>
          </div>
        )}
        <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:px-12">
          <Tooltip>
            <TooltipTrigger asChild>
              <label className={cn(
                buttonVariants({ size: 'sm', variant: 'outline' }),
                'absolute left-0 top-4 h-8 w-8 rounded-full bg-background p-0 sm:left-4'
              )}>
                {fileUploading ?  <IconSpinner /> : <IconUpload /> }
                <span className="sr-only">Upload File</span>
              <input
                type="file"
                onChange={fileUploadOnChange}
                style={{ display: 'none' }}
                disabled={isLoading || fileUploading || !loggedIn}
              />
              </label>
            </TooltipTrigger>
            <TooltipContent>Upload File</TooltipContent>
          </Tooltip>
          <Textarea
            ref={inputRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Send a message."
            spellCheck={false}
            className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
            disabled={isLoading || fileUploading || !loggedIn}
          />
          <div className="absolute right-0 top-4 sm:right-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || input === '' || !loggedIn}
                >
                  <IconArrowElbow />
                  <span className="sr-only">Send message</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send message</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </form>
  )
}
