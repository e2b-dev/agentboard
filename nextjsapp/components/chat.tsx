'use client'

import { useChat, type Message } from 'ai/react'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import * as agents from '@/lib/agents'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'react-hot-toast'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
}

export function Chat({ id, initialMessages, className }: ChatProps) {
  
  const [sandboxID, setSandboxID] = useState("")
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const { messages, append, reload, stop, isLoading, input, setInput, handleSubmit } =
    useChat({
      initialMessages,
      id,
      body: {
        id,
        sandboxID
      },
      onResponse(response) {
        if (response.status === 401) {
          toast.error(response.statusText)
        }
      }
    })
  async function stopEverything() {
    // Call the original stop function
    stop();

    // Make a call to the /killchat API endpoint
    try {
        const response = await fetch('/api/kill-chat', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error while calling killchat:', error);
    }
  }
  

  useEffect(() => {
    
    const fetchSandboxID = async () => {
      console.log("fetching sandboxID. sandboxID: " + sandboxID)
      if (sandboxID == ""){
        await fetch('/api/create-sandbox', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        })
          .then(res => res.json())
          .then(data => {
            if (data.sandboxID != null) {
              setSandboxID(data.sandboxID)
              console.log("sandboxID set to: " + data.sandboxID)
            }
            else {
              setSandboxID("None")
            }
          })
          .catch(err => {
            console.error(err)
          })
      }
    }

    // Sandbox not required for local development
    fetchSandboxID()
      .catch(err => console.error(err))
  }, [])

  

  return (
    
      <>
        <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
          {messages.length ? (
            <>
              <ChatList messages={messages} agentType={agents['OPEN_INTERPRETER']} />
              <ChatScrollAnchor trackVisibility={isLoading} />
            </>
          ) : (
            <EmptyScreen setInput={setInput} />
          )}
        </div>
        {<ChatPanel
          id={id}
          isLoading={isLoading}
          stop={stopEverything}
          append={append}
          reload={reload}
          messages={messages}
          input={input}
          setInput={setInput}
        />}
      </>
  )
}
