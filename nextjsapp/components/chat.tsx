'use client'

import { useChat, type Message } from 'ai/react'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import * as agents from '@/lib/agents'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
}

export function Chat({ id, initialMessages, className }: ChatProps) {
  
  const [sandboxID, setSandboxID] = useState("")
  const [firstMessageSubmitted, setFirstMessageSubmitted] = useState(false)

  const { messages, reload, stop, isLoading, input, setInput, handleSubmit } =
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
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({sandboxID: sandboxID})
        })
        const data = await response.text();
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${data}`);
        }
    } catch (error) {
        console.error('Error while calling killchat:', error);
    }
  }
  

  useEffect(() => {
    
    const fetchSandboxID = async () => {
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

  const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!firstMessageSubmitted) {
      setFirstMessageSubmitted(true)

      // wait for sandboxID to populate
      while(true) {
        if(sandboxID != "") break
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    if (!input?.trim()) {
      return
    }
    setInput('')
    await handleSubmit(e)
  }

  return (

      <>
        <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
          {firstMessageSubmitted ? (
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
          reload={reload}
          messages={messages}
          input={input}
          setInput={setInput}
          handleSubmit={handleMessageSubmit}
        />}
      </>
  )
}
