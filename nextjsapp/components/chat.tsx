'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { useChat, type Message } from 'ai/react'
import { track } from '@vercel/analytics'
import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import * as agents from '@/lib/agents'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { IconSpinner, IconFeedback } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  loggedIn: boolean
}
interface SandboxData {
  sandboxID: string
}

export function Chat({ id, initialMessages, className, loggedIn }: ChatProps) {

  /* State for sandbox management */
  const [sandboxID, setSandboxID] = useState('')
  const [receivedSandboxID, setReceivedSandboxID] = useState(false)

  /* State for first message submitted */
  const [firstMessageSubmitted, setFirstMessageSubmitted] = useState(false)

  /* State for text input */
  const [pendingMessageInputValue, setPendingMessageInputValue] = useState<string | null>(null)

  /* State for file upload input */
  const [pendingFileInputValue, setPendingFileInputValue] = useState<React.ChangeEvent<HTMLInputElement> | null>(null)
  const [fileUploading, setFileUploading] = useState(false)

  /* State for feedback dialog */
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [sendingFeedback, setSendingFeedback] = useState(false)

  /* State for chat messages */
  const { messages, append, reload, stop, isLoading, input, setInput, handleSubmit, setMessages } = useChat({
    initialMessages,
    id,
    body: { id, sandboxID },
    onResponse(response) {
      if (response.status === 401) {
        toast.error(response.statusText)
      }
    }
  })

  /* Creates sandbox and stores the sandbox ID */
  const fetchSandboxID = async () => {
    if (sandboxID == '') {
      await fetch('/api/create-sandbox', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}, response: ${JSON.stringify(res)}`)
          return res.json()
        })
        .then(data => {
          return new Promise(resolve => setTimeout(() => resolve(data), 5000))
        })
        .then((data: unknown) => {
          const sandboxData = data as SandboxData
          setSandboxID(sandboxData.sandboxID)
          setTimeout(() => setReceivedSandboxID(true), 5000)
        })
        .catch(err => {
          console.error(err)
        })
    }
  }

  /* Creates sandbox on first load */
  const fetchSandboxIDCalled = useRef(false)
  useEffect(() => {
    if (!fetchSandboxIDCalled.current && sandboxID == '' && loggedIn) {
      fetchSandboxID().catch(err => console.error(err))
      fetchSandboxIDCalled.current = true;
    }
  }, [sandboxID, loggedIn])

  /* Stores user file input in pendingFileInputValue */
  async function fileUploadOnChange(e: React.ChangeEvent<HTMLInputElement>) {
    // indicate to user that file is uploading
    
    const originalMessages = messages
    const updatedMessages = [
      ...originalMessages,
      {
        id: id || 'default-id',
        content: `Uploading \`${e.target.files ? e.target.files[0].name : 'file'}\`...`,
        role: 'user' as 'user'
      }
    ]
    setMessages(updatedMessages)

    setFirstMessageSubmitted(true)
    setPendingFileInputValue(e)

  }

  /* Sends pending file input to sandbox after sandbox is created */
  useEffect(() => {
    const executePendingFileUploadEvent = () => {
      if (receivedSandboxID && pendingFileInputValue) {
        if (pendingFileInputValue.target.files) {

          // needed to disable other user input while file is uploading
          setFileUploading(true)

          // prepare file for upload
          const file = pendingFileInputValue.target.files[0]
          const formData = new FormData()
          formData.append('file', file)
          formData.append('fileName', file.name)
          formData.append('sandboxID', sandboxID)

          
          // upload file
          fetch('/api/upload-file', {
            method: 'POST',
            body: formData
          })
            .then(async response => {
              if (!response.ok) {
                console.log("Error when uploading file - response not ok")
                const errorText = await response.text()
                console.log(`Error details: ${errorText}`);
                throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
              }

              // replace file upload message with success message
              let newMessages = [
                ...messages,
                {
                  id: id || 'default-id',
                  content: `Uploaded \`${file.name}\` ✅`,
                  role: 'user' as 'user'
                }
              ]
              setMessages(newMessages)
            })
            .catch(error => {
              console.error('Error when uploading file:', error)

              // replace file upload message with error message
              let newMessages = [
                ...messages,
                {
                  id: id || 'default-id',
                  content: `Unable to upload \`${file.name}\`!`,
                  role: 'user' as 'user'
                }
              ]
              setMessages(newMessages)
            })
            .finally(() => {
              setPendingFileInputValue(null)
              setFileUploading(false)
              
              // required to allow user to upload the same file again
              pendingFileInputValue.target.value = ''
            })
        }
      }
    }
    executePendingFileUploadEvent()
  }, [receivedSandboxID, pendingFileInputValue])


  /* Stores user text input in pendingMessageInputValue */
  const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input?.trim()) {
      return
    }
    if (!firstMessageSubmitted) {
      setFirstMessageSubmitted(true)
    }

    if (receivedSandboxID) {
      track('chat_message_sent')
      handleSubmit(e)
    } else {
      setPendingMessageInputValue(input)
      const updatedMessages = [
        ...messages,
        {
          id: id || 'default-id',
          content: input,
          role: 'user' as 'user'
        }
      ]
      setMessages(updatedMessages)
      setInput('')
    }
  }
  /* Sends the pending message to sandbox once it is created */
  useEffect(() => {
    const executePendingSubmitEvent = () => {
      if (receivedSandboxID && pendingMessageInputValue) {
        track('chat_message_sent')
        setMessages(messages.slice(0, -1))
        append({
          id,
          content: pendingMessageInputValue,
          role: 'user'
        })
        setPendingMessageInputValue(null)
      }
    }
    executePendingSubmitEvent()
  }, [receivedSandboxID, pendingMessageInputValue])



  /* Allows the user to download files from the sandbox */
  const handleSandboxLink = (href: string) => {
    fetch('/api/download-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sandboxID: sandboxID, fileName: href })
    })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = href.split('/').pop() || 'download'
        document.body.appendChild(a)
        a.click()
        a.remove()
      })
      .catch(err => {
        console.error(err)
      })
  }

  /* This function stops generation by calling /api/killchat */
  async function stopEverything() {
    // Call the original stop function
    stop()

    // Make a call to the /killchat API endpoint
    try {
      const response = await fetch('/api/kill-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sandboxID: sandboxID })
      })
      const data = await response.text()
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${data}`)
      }
    } catch (error) {
      console.error('Error while calling killchat:', error)
    }
  }

  return (
    <>
      <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
        {firstMessageSubmitted ? (
            <>
              <ChatList
                messages={messages}
                agentType={agents['OPEN_INTERPRETER']}
                handleSandboxLink={handleSandboxLink}
                isLoading={isLoading}
              />
              {!receivedSandboxID && <>
                <div className="flex flex-col justify-center items-center">
                  <p>Finishing sandbox bootup... </p>
                  <p>
                    <IconSpinner />
                  </p>
                </div>
              </>}
              <ChatScrollAnchor trackVisibility={isLoading} />
            </>
          ) : (
          <EmptyScreen setInput={setInput} />
        )}
      </div>

      <ChatPanel
        id={id}
        isLoading={isLoading}
        stop={stopEverything}
        reload={reload}
        messages={messages}
        input={input}
        setInput={setInput}
        handleSubmit={handleMessageSubmit}
        fileUploadOnChange={fileUploadOnChange}
        fileUploading={fileUploading}
        loggedIn={loggedIn}
      />

      <button
        className="fixed bottom-5 right-5 bg-black rounded-full p-3 hover:bg-gray-800"
        onClick={() => setFeedbackDialogOpen(true)}
      >
        <IconFeedback className="w-5 h-5" />
      </button>
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback Form</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Please describe the issue you are experiencing:
          </DialogDescription>
          <Input
            value={feedbackText}
            placeholder="Write feedback here"
            onChange={e => setFeedbackText(e.target.value)}
          />
          <Button
            className="px-4 py-2 mt-2 rounded-md w-full sm:max-w-1/3"
            onClick={() => {
              setSendingFeedback(true)
              fetch('/api/send-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback: feedbackText })
              })
                .then(response => {
                  if (!response.ok) {
                    throw new Error(
                      'Failed to send feedback - refresh the page and try again later'
                    )
                  }
                  setFeedbackDialogOpen(false)
                  setFeedbackText('')
                })
                .catch(err => {
                  setFeedbackText(err.message)
                  console.error(err)
                })
                .finally(() => {
                  setSendingFeedback(false)
                })
            }}
          >
            {sendingFeedback ? <IconSpinner /> : 'Submit'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
