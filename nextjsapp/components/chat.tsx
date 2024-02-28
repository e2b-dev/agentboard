'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { useChat, type Message } from 'ai/react'
import { usePostHog } from 'posthog-js/react'

import { createClient } from '@/utils/supabase/client'
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
import { CHAT_API_ENDPOINT } from '@/lib/constants'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string, 
  session?: any
}
interface SandboxData {
  sandboxID: string
}

const startToken = "AI<ST>"
const endToken = "AI<ET>"
const regexPattern = new RegExp(`${startToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(.*?)${endToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gs');


export function Chat({ id, initialMessages, className, session }: ChatProps) {

  /* State for sandbox management */
  const [sandboxID, setSandboxID] = useState<string | null>(null)

  /* State for first message submitted */
  const [firstMessageSubmitted, setFirstMessageSubmitted] = useState(false)

  /* State for text input */
  const [pendingMessagesValue, setPendingMessagesValue] = useState<Message[]| null>(null)

  /* State for file upload input */
  const [pendingFileInputValue, setPendingFileInputValue] = useState<File | null>(null)
  const [fileUploading, setFileUploading] = useState(false)

  /* State for feedback dialog */
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [sendingFeedback, setSendingFeedback] = useState(false)

  /* State for dragging files */
  const [dragging, setDragging] = useState(false)

  /* State for chatStreaming */
  const [chatResponseLoading, setChatResponseLoading] = useState(false)

  /* Chat state management */
  const { messages, stop, input, setInput, setMessages } = useChat({
    initialMessages,
    id,
    body: { id }
  })

  const supabase = createClient()
  const posthog = usePostHog()
  
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
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}, response: ${JSON.stringify(res)}`)
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
  // btw, !!session is shorthand for 'logged in'
  const fetchSandboxIDCalled = useRef(false)
  useEffect(() => {
    if (!fetchSandboxIDCalled.current && !sandboxID && !!session) {
      fetchSandboxID().catch(err => console.error(err))
      fetchSandboxIDCalled.current = true;
    }
  }, [sandboxID, !!session])

  /* Stores user file input in pendingFileInputValue */
  async function fileUploadOnChange(e: React.ChangeEvent<HTMLInputElement> | DragEvent) {
    // indicate to user that file is uploading
    
    let file : File | undefined | null = null
    if (e instanceof DragEvent) {
      file = e.dataTransfer?.files[0]
    } 
    else if (e && 'target' in e && e.target.files) {
      file = e.target.files[0]
    }
    else {
      console.log("Error: fileUploadOnChange called with invalid event type")
      return
    }
    let newMessages = [
      ...messages,
      {
        id: id || 'default-id',
        content: `Uploading \`${file?.name}\` ...`,
        role: 'user' as 'user'
      }
    ]
    setMessages(newMessages)
    setFirstMessageSubmitted(true)
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

  /* Attaches listeners to window to allow user to drag and drop files */
  useEffect(() => {
    const dragEvents = ['dragenter', 'dragover', 'dragleave', 'drop'];
    const dragHandler = (event: any) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const dragStartHandler = (event: DragEvent) => {
      setDragging(true);
      dragHandler(event);
    };
    const dragEndHandler = (event: DragEvent) => {
      setDragging(false);
      dragHandler(event);
    };
    const dropHandler = (event: DragEvent) => {
      setDragging(false);
      if (event.dataTransfer && event.dataTransfer.files.length > 0) {
        fileUploadOnChange(event);
        setFileUploading(true)
        event.dataTransfer.clearData();
      }
      dragHandler(event);
    };
    dragEvents.forEach(eventName => {
      window.addEventListener(eventName, dragHandler);
    });
    window.addEventListener('dragover', dragStartHandler);
    window.addEventListener('dragleave', dragEndHandler);
    window.addEventListener('drop', dropHandler);
    return () => {
      dragEvents.forEach(eventName => {
        window.removeEventListener(eventName, dragHandler);
      });
      window.removeEventListener('dragover', dragStartHandler);
      window.removeEventListener('dragleave', dragEndHandler);
      window.removeEventListener('drop', dropHandler);
    };
  }, []);

  const reload = () => {
    if (messages.length <= 1) {
      return
    }
    const updatedMessages = messages.slice(0,-1)
    setMessages(updatedMessages)
    setChatResponseLoading(true)
    submitAndUpdateMessages(updatedMessages).catch(err => console.error(err))
  }

  /* utility function to handle the errors when getting a response from the /chat API endpoint */
  const handleChatResponse = (response: Response) => {
    if (response.ok) {
      return
    }
    if (response.status === 401) {
      toast.error(response.statusText)
    }
    else if (response.status === 500) {
      toast.error("Your sandbox closed after 5 minutes of inactivity. Please refresh the page to start a new sandbox.")
    }
    else {
      toast.error(`An unexpected ${response.status} error occurred. Please send your message again after reloading.`);
      // Hopefully this will help debug the rogue 502 and 405 errors
      fetch('/api/send-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback: JSON.stringify({
          errorStatus: response.status,
          errorMessage: response.statusText,
          timestamp: new Date().toISOString(),
        })}),
      })
      .then(async feedbackResponse => {
        // Check if the response is JSON
        const contentType = feedbackResponse.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          return feedbackResponse.json();
        } else {
          // Handle non-JSON responses
          return feedbackResponse.text().then(text => ({ message: text }));
        }
      })
      .then(data => {
        // Handle the data (JSON or text wrapped in an object)
        console.log('Feedback response:', data.message);
      })
      .catch(feedbackError => {
        console.error('Error sending feedback:', feedbackError);
      });
    }
  }
  const submitAndUpdateMessages = async (updatedMessages: Message[]) => {
    
    // If the session has an expired access token, this method will use the refresh token to get a new session.
    const { data: {session} } = await supabase.auth.getSession()

    try{
      posthog?.capture('chat_message_sent', {
        message: updatedMessages[updatedMessages.length - 1],
        user: session?.user?.id
      })
    } catch (error) {
      console.error('Error recording chat_message_sent event:', error)
    }
  
    try {
      // call the /chat API endpoint
      const res = await fetch(CHAT_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
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

      // start the timer when the first byte is received
      let startTime = Date.now()

      if (reader) {

        // keep reading from stream until done
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            setChatResponseLoading(false)
            break;
          }
          // Check the time elapsed since the first byte was received
          if (Date.now() - startTime > 1050000) { // 105 seconds
            // Notify the user about the timeout
            toast.error("Sorry, the response was too lengthy and it timed out. Try again with a shorter task.");
            setChatResponseLoading(false)
            await reader.cancel();
            break; // Exit the loop or handle as needed
          }
          const text = textDecoder.decode(value);
          let fullyFormattedText = decodeURIComponent(text)

          // use regex to parse out the data between the start and end tokens
          const matches = fullyFormattedText.match(regexPattern);
          if (!matches) {
            continue
          }
          
          // split the data into chunks
          const chunks = matches.map(match => match.replace(new RegExp(`^${startToken}|${endToken}$`, 'g'), ''));

          // process each chunk individually
          for (const chunk of chunks) {
            messageBuffer += chunk
            const lastMessage = {
              id: id || 'default-id',
              content: messageBuffer,
              role: 'assistant' as 'assistant'
            }
            setMessages([...previousMessages, lastMessage]);

          }
        }
      }
    } catch (error) {
      console.log("Error when fetching chat response: ", error)
    }
  }
  /* Stores user text input in pendingMessageInputValue */
  const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setChatResponseLoading(true)
    if (!input?.trim()) {
      return
    }
    if (!firstMessageSubmitted) {
      setFirstMessageSubmitted(true)
    }

    // add user message to the messages array
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
        submitAndUpdateMessages(pendingMessagesValue).catch(err => console.error(err))
        setPendingMessagesValue(null)
      }
    }
    executePendingSubmitEvent()
  }, [sandboxID, pendingMessagesValue])

  /* Allows the user to download files from the sandbox */
  const handleSandboxLink = (href: string) => {
    fetch('/api/download-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sandboxID: sandboxID, filePath: href })
    })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok.');
        return response.blob();
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

  /* This function stops generation by calling /api/killchat */
  /* TODO: REMOVE THIS FUNCTION, /api/killchat ISN'T NEEDED */
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
    {dragging && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 border-4 border-dashed border-green-700">
        <p className="text-xl font-semibold text-white bg-black bg-opacity-20 p-4">Drop files to upload</p>
      </div>
    )}
      <div className={cn('pb-[200px] pt-4 md:pt-10', className)}>
        {firstMessageSubmitted ? (
            <>
              <ChatList
                messages={messages}
                agentType={agents['OPEN_INTERPRETER']}
                handleSandboxLink={handleSandboxLink}
                isLoading={chatResponseLoading}
              />
              {!sandboxID && <>
                <div className="flex flex-col justify-center items-center">
                  <p>Finishing sandbox bootup... </p>
                  <p>
                    <IconSpinner />
                  </p>
                </div>
              </>}
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
        loggedIn={!!session}
        sandboxID={sandboxID || ''}
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
