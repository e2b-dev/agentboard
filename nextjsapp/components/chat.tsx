'use client'

import { useChat, type Message } from 'ai/react'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import { IconSpinner } from './ui/icons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'react-hot-toast'

// const IS_PREVIEW = process.env.VERCEL_ENV === 'preview'
export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
}

export function Chat({ id, initialMessages, className }: ChatProps) {
  const [previewToken, setPreviewToken] = useState("")
  const [previewTokenInput, setPreviewTokenInput] = useState(previewToken ?? '')
  const [openAIKeySubmitButtonText, setOpenAIKeySubmitButtonText] = useState("Submit")
  const [validatingKey, setValidatingKey] = useState(false)
  const { messages, append, reload, stop, isLoading, input, setInput } =
    useChat({
      initialMessages,
      id,
      body: {
        id,
        previewToken
      },
      onResponse(response) {
        if (response.status === 401) {
          toast.error(response.statusText)
        }
      }
    })


  useEffect(() => {
      const fetchKey = async () => {
        if (previewToken == ""){
          await fetch('/api/get-openai-key', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          })
            .then(res => res.json())
            .then(data => {
              if (data.key != null) {
                setPreviewToken(data.key)
              }
              else {
                setPreviewToken("None")
              }
            })
            .catch(err => {
              console.error(err)
            })
        }
      }
      fetchKey()

  }, [previewToken])


  const validateKey = async () => {
    setOpenAIKeySubmitButtonText("Validating...")

    try {
      const response = await fetch('/api/validate-openai-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key: previewTokenInput })
      });
  
      const data = await response.json();
  
      if (data.valid) {
        setOpenAIKeySubmitButtonText("Valid Key. Saving...");
  
        const saveResponse = await fetch('/api/save-openai-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ key: previewTokenInput })
        });
  
        const saveData = await saveResponse.json();
  
        if (saveData.error) {
          setOpenAIKeySubmitButtonText("Unable to save key. Try again.");
        } else {
          setOpenAIKeySubmitButtonText("Success!");
          setPreviewToken(previewTokenInput);
          setValidatingKey(false);
        }
      } else {
        setOpenAIKeySubmitButtonText("Invalid Key. Try again.");
      }
    } catch (error) {
      console.error(error);
      setOpenAIKeySubmitButtonText("Error occurred. Try again.");
    }
  };

  return (
    
      <>
        <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
          {messages.length ? (
            <>
              <ChatList messages={messages} />
              <ChatScrollAnchor trackVisibility={isLoading} />
            </>
          ) : (
            previewToken == "" ? 
            <div className="flex flex-col justify-center items-center">
              <p>Checking for OpenAI API key...</p>
              <p><IconSpinner/></p>
            </div> :
            <EmptyScreen setInput={setInput} />
          )}
        </div>
        <ChatPanel
          id={id}
          isLoading={isLoading && previewToken != ""}
          stop={stop}
          append={append}
          reload={reload}
          messages={messages}
          input={input}
          setInput={setInput}
        />

        {(previewToken == "None") && (
          <Dialog open={previewToken == "None"}>
              <DialogContent>
              <DialogHeader>
                  <DialogTitle>Enter your OpenAI Key</DialogTitle>
                  <DialogDescription>
                  Get your API key on the{' '}
                  <a
                      href="https://platform.openai.com/signup/"
                      className="underline"
                  >
                      OpenAI website
                  </a>{' '}
                  . Your API key will be used to run the AI agents on Agentboard.
                  </DialogDescription>
              </DialogHeader>
              <Input
                  value={previewTokenInput}
                  placeholder="OpenAI API key"
                  onChange={e => setPreviewTokenInput(e.target.value)}
              />
              <DialogFooter className="items-center">
                  <Button
                  onClick={validateKey}
                  disabled={validatingKey || !previewTokenInput}
                  >
                  {openAIKeySubmitButtonText}
                  </Button>
              </DialogFooter>
              </DialogContent>
          </Dialog>)
        }
      </>
  )
}
