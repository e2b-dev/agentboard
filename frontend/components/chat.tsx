'use client'

import {
  useState,
  useEffect,
  useRef,
  ComponentProps,
  ChangeEvent,
  FormEvent
} from 'react'
import { toast } from 'react-hot-toast'
import { useChat, type Message } from 'ai/react'
import { type User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import { IconSpinner } from '@/components/ui/icons'
import { CHAT_API_ENDPOINT } from '@/lib/constants'
import { useAgent } from '@/lib/hooks/use-agent'

interface ChatProps extends ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  user?: User
}
interface SandboxData {
  sandboxID: string
}

const sandboxPort = 49982

export function Chat({ id, initialMessages, className, user }: ChatProps) {
  /* State for sandbox management */
  const [sandboxID, setSandboxID] = useState<string | null>(null)

  /* State for text input */
  const [pendingMessagesValue, setPendingMessagesValue] = useState<
    Message[] | null
  >(null)

  /* State for file upload input */
  const [pendingFileInputValue, setPendingFileInputValue] =
    useState<File | null>(null)
  const [fileUploading, setFileUploading] = useState(false)

  /* State for dragging files */
  const [dragging, setDragging] = useState(false)

  /* State for chatStreaming */
  const [chatResponseLoading, setChatResponseLoading] = useState(false)

  /* Chat state management */
  const { messages, input, setInput, setMessages } = useChat({
    initialMessages,
    id,
    body: { id }
  })
  const { agent, model } = useAgent()

  const userPressedStopGeneration = useRef(false)

  const supabase = createClient()

  /* Creates sandbox and stores the sandbox ID */
  const fetchSandboxID = async () => {
    if (!sandboxID) {
      await fetch('/api/create-sandbox', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(res => {
          if (!res.ok)
            throw new Error(
              `HTTP error! status: ${res.status}, response: ${JSON.stringify(
                res
              )}`
            )
          return res.json()
        })
        .then((data: unknown) => {
          const sandboxData = data as SandboxData
          setSandboxID(sandboxData.sandboxID)
        })
        .catch(err => {
          console.error(err)
        })
    }
  }

  /* Ensures we only create a sandbox once (even with strictmode doublerendering) */
  const fetchSandboxIDCalled = useRef(false)
  useEffect(() => {
    if (!fetchSandboxIDCalled.current && !sandboxID && !!user) {
      fetchSandboxID().catch(err => console.error(err))
      fetchSandboxIDCalled.current = true
    }
  }, [sandboxID, user])

  /* Stores user file input in pendingFileInputValue */
  async function fileUploadOnChange(
    e: ChangeEvent<HTMLInputElement> | DragEvent
  ) {
    // indicate to user that file is uploading

    let file: File | undefined | null = null
    if (e instanceof DragEvent) {
      file = e.dataTransfer?.files[0]
    } else if (e && 'target' in e && e.target.files) {
      file = e.target.files[0]
    } else {
      console.log('Error: fileUploadOnChange called with invalid event type')
      return
    }
    let newMessages: Message[] = [
      ...messages,
      {
        id: id || 'default-id',
        content: `Uploading \`${file?.name}\` ...`,
        role: 'user'
      }
    ]
    setMessages(newMessages)
    setPendingFileInputValue(file ? file : null)
  }

  /* Sends pending file input to sandbox after sandbox is created */
  useEffect(() => {
    const executePendingFileUploadEvent = () => {
      if (sandboxID && pendingFileInputValue) {
        if (pendingFileInputValue) {
          // needed to disable other user input while file is uploading
          setFileUploading(true)

          // prepare file for upload
          const formData = new FormData()
          formData.append('file', pendingFileInputValue)
          formData.append('fileName', pendingFileInputValue.name)
          formData.append('sandboxID', sandboxID)

          // upload file
          fetch('/api/upload-file', {
            method: 'POST',
            body: formData
          })
            .then(async response => {
              if (!response.ok) {
                console.log('Error when uploading file - response not ok')
                const errorText = await response.text()
                console.log(`Error details: ${errorText}`)
                throw new Error(
                  `HTTP error! status: ${response.status}, details: ${errorText}`
                )
              }

              // replace file upload message with success message
              let newMessages = [
                ...messages,
                {
                  id: id || 'default-id',
                  content: `Uploaded \`${pendingFileInputValue.name}\` ✅`,
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
                  content: `Unable to upload \`${pendingFileInputValue.name}\`!`,
                  role: 'user' as 'user'
                }
              ]
              setMessages(newMessages)
            })
            .finally(() => {
              setPendingFileInputValue(null)
              setFileUploading(false)

              // required to allow user to upload the same file again
              // pendingFileInputValue.target.value = ''
            })
        }
      }
    }
    executePendingFileUploadEvent()
  }, [sandboxID, pendingFileInputValue])

  /* Attaches supabase listener that clears the message history when user logs out */
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        // Clear message history when the user logs out or their account is deleted
        setMessages([])
        setSandboxID(null)
      }
    })

    return () => {
      // Cleanup the listener when the component unmounts
      authListener.subscription?.unsubscribe()
    }
  }, [])

  /* Attaches listeners to window to allow user to drag and drop files */
  useEffect(() => {
    const dragEvents = ['dragenter', 'dragover', 'dragleave', 'drop']
    const dragHandler = (event: any) => {
      event.preventDefault()
      event.stopPropagation()
    }
    const dragStartHandler = (event: DragEvent) => {
      setDragging(true)
      dragHandler(event)
    }
    const dragEndHandler = (event: DragEvent) => {
      setDragging(false)
      dragHandler(event)
    }
    const dropHandler = (event: DragEvent) => {
      setDragging(false)
      if (event.dataTransfer && event.dataTransfer.files.length > 0) {
        fileUploadOnChange(event)
        setFileUploading(true)
        event.dataTransfer.clearData()
      }
      dragHandler(event)
    }
    dragEvents.forEach(eventName => {
      window.addEventListener(eventName, dragHandler)
    })
    window.addEventListener('dragover', dragStartHandler)
    window.addEventListener('dragleave', dragEndHandler)
    window.addEventListener('drop', dropHandler)
    return () => {
      dragEvents.forEach(eventName => {
        window.removeEventListener(eventName, dragHandler)
      })
      window.removeEventListener('dragover', dragStartHandler)
      window.removeEventListener('dragleave', dragEndHandler)
      window.removeEventListener('drop', dropHandler)
    }
  }, [])

  /* Cancels most recent assistant response and sends most recent user message to sandbox again */
  const reload = () => {
    // sometimes no assistant message has come in yet, we will just submit the previous user message
    console.log('reload, messages: ', messages)
    if (messages[messages.length - 1].role === 'user') {
      setChatResponseLoading(true)
      submitAndUpdateMessages(messages).catch(err => console.error(err))
    }
    // assistant message was the most recent message in the messages array
    else {
      const updatedMessages = messages.slice(0, -1)
      setMessages(updatedMessages)
      setChatResponseLoading(true)
      submitAndUpdateMessages(updatedMessages).catch(err => console.error(err))
    }
  }

  /* utility function to handle the errors when getting a response from the /chat API endpoint */
  const handleChatResponse = (response: Response) => {
    if (response.ok) {
      return
    }
    if (response.status === 401) {
      toast.error(response.statusText)
    } else if (response.status === 500) {
      toast.error(
        'Your sandbox closed after 5 minutes of inactivity. Please refresh the page to start a new sandbox.'
      )
    } else {
      toast.error(
        `An unexpected ${response.status} error occurred. Please send your message again after reloading.`
      )
    }
  }

  const submitAndUpdateMessages = async (updatedMessages: Message[]) => {
    // If the session has an expired access token, this method will use the refresh token to get a new session.
    const {
      data: { session }
    } = await supabase.auth.getSession()

    try {
      // call the /chat API endpoint
      const res = await fetch(CHAT_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          agent: agent,
          model: model,
          messages: updatedMessages
        })
      })

      handleChatResponse(res)

      // check if response was ok
      if (!res.ok) {
        console.error(`/chat HTTP error! status: ${res.status}`)
        return
      }

      // parse stream response
      const reader = res.body?.getReader()
      const previousMessages = JSON.parse(JSON.stringify(updatedMessages))
      let messageBuffer = ''
      const textDecoder = new TextDecoder()

      // start the timer when the first byte is received for timeout later
      let startTime = Date.now()

      if (reader && !userPressedStopGeneration.current) {
        // keep reading from stream until done
        while (true) {
          const { value, done } = await reader.read()
          if (done) {
            setChatResponseLoading(false)
            break
          }
          // Load balancer has a timeout of 10 minutes from first to last streamed byte per response.
          // This prevents the user from seeing randomly truncated output.
          if (Date.now() - startTime > 3 * 60 * 1000) {
            // 3 minutes timeout
            // Notify the user about the timeout
            toast.error(
              'Sorry, the response was too lengthy and it timed out. Try again with a shorter task.'
            )
            setChatResponseLoading(false)
            await reader.cancel()
            break // Exit the loop or handle as needed
          }

          // user pressed stop generation
          if (userPressedStopGeneration.current) {
            await reader.cancel()
            break
          }

          const text = textDecoder.decode(value)
          messageBuffer += decodeURIComponent(text)

          const lastMessage = {
            id: id || 'default-id',
            content: messageBuffer,
            role: 'assistant' as 'assistant'
          }
          setMessages([...previousMessages, lastMessage])
        }
      }

      userPressedStopGeneration.current = false
    } catch (error) {
      console.log('Error when fetching chat response: ', error)
    }
  }

  /* Stores user text input in pendingMessageInputValue */
  const handleMessageSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setChatResponseLoading(true)
    if (!input?.trim()) {
      return
    }

    // add user message to the messages array
    const updatedMessages: Message[] = [
      ...messages,
      {
        id: id || 'default-id',
        content: input,
        role: 'user'
      } as Message
    ]
    setMessages(updatedMessages)
    setInput('')

    if (sandboxID) {
      // get the response from the sandbox with the updates messages array
      submitAndUpdateMessages(updatedMessages).catch(err => console.error(err))
    } else {
      setPendingMessagesValue(updatedMessages)
    }
  }

  /* Sends the pending message to sandbox once it is created */
  useEffect(() => {
    const executePendingSubmitEvent = async () => {
      if (sandboxID && pendingMessagesValue) {
        submitAndUpdateMessages(pendingMessagesValue).catch(err =>
          console.error(err)
        )
        setPendingMessagesValue(null)
      }
    }
    executePendingSubmitEvent()
  }, [sandboxID, pendingMessagesValue])

  /* Allows the user to download files from the sandbox */
  const handleSandboxLink = (href: string) => {
    fetch(`https://${sandboxPort}-${sandboxID}.e2b.dev/file?path=${href}`)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok.')
        return response.blob()
      })
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

  const stopEverything = async () => {
    setChatResponseLoading(false)
    userPressedStopGeneration.current = true
  }
  return (
    <>
      {dragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center border-4 border-dashed border-green-700 bg-black bg-opacity-70">
          <p className="bg-black bg-opacity-20 p-4 text-xl font-semibold text-white">
            Drop files to upload
          </p>
        </div>
      )}
      <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
        {messages.length ? (
          <>
            <ChatList
              messages={messages}
              agentType={agent}
              handleSandboxLink={handleSandboxLink}
              isLoading={chatResponseLoading}
            />
            {!sandboxID && (
              <>
                <div className="flex flex-col items-center justify-center">
                  <p>Finishing sandbox bootup... </p>
                  <p>
                    <IconSpinner />
                  </p>
                </div>
              </>
            )}
            <ChatScrollAnchor trackVisibility={chatResponseLoading} />
          </>
        ) : (
          <EmptyScreen setInput={setInput} />
        )}
      </div>

      <ChatPanel
        id={id}
        isLoading={chatResponseLoading}
        stop={stopEverything}
        reload={reload}
        messages={messages}
        input={input}
        setInput={setInput}
        handleSubmit={handleMessageSubmit}
        fileUploadOnChange={fileUploadOnChange}
        fileUploading={fileUploading}
        loggedIn={!!user}
        sandboxID={sandboxID || ''}
      />
    </>
  )
}
