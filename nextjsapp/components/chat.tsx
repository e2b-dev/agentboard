'use client'

import { useChat, type Message } from 'ai/react'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import * as agents from '@/lib/agents'
import { IconSpinner } from './ui/icons'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
}
interface SandboxData {
  sandboxID: string;
}

export function Chat({ id, initialMessages, className }: ChatProps) {
  
  const [sandboxID, setSandboxID] = useState("")
  const [firstMessageSubmitted, setFirstMessageSubmitted] = useState(false)
  const [receivedSandboxID, setReceivedSandboxID] = useState(false)
  const [pendingInputValue, setPendingInputValue] = useState<string | null>(null);

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
        .then(res => {
          if(!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json()
        })
        .then(data => {
          return new Promise(resolve => setTimeout(() => resolve(data), 5000));
        })
        .then((data: unknown) => {
          const sandboxData = data as SandboxData
          setSandboxID(sandboxData.sandboxID)
          setTimeout(() => setReceivedSandboxID(true), 3000)
        })
        .catch(err => {
          console.error(err)
        })
      }
    }

    if(sandboxID == ""){
      fetchSandboxID()
        .catch(err => console.error(err))
    }
  }, [sandboxID])

  useEffect(() => {
    const executePendingSubmitEvent = () => {
      if(receivedSandboxID && pendingInputValue){
        console.log('submitting pending event')
        setInput('')
        append({
          id,
          content: pendingInputValue,
          role: 'user'
        })
        setPendingInputValue(null)
      }
    }
    executePendingSubmitEvent()
  }, [receivedSandboxID, pendingInputValue])

  const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input?.trim()) {
      return
    }
    if (!firstMessageSubmitted) {
      setFirstMessageSubmitted(true)
    }

    if(receivedSandboxID){
      handleSubmit(e)
    }
    else{
      setPendingInputValue(input)
    }
    
  }
  return (

      <>
        <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
          {firstMessageSubmitted ? (
            !receivedSandboxID ? 
                <>
                <div className="flex flex-col justify-center items-center">
                  <p>Finishing sandbox bootup... </p>
                  <p><IconSpinner/></p>
                </div> 
                </>
                :
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
