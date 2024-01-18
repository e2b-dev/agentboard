'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button} from '@/components/ui/button'
import { IconGitHub, IconSpinner, IconGoogle } from '@/components/ui/icons'

export function GithubLoginButton({ ...props}) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  console.log("process.env.NEXT_PUBLIC_VERCEL_URL", process.env.NEXT_PUBLIC_VERCEL_URL)
  return (
    <Button
      variant="outline"
      onClick={async () => {
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({ 
          provider: 'github',
          options: {
            redirectTo: process.env.NEXT_PUBLIC_VERCEL_URL + '/auth/callback'
          }
        })
        if (error){
          console.error('Error signing in:', error.message)
          setIsLoading(false)
        }
        
        else router.push('/')

      }}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="mr-2 animate-spin" />
      ) : (
        <IconGitHub className="mr-2" />
      ) }
      {"Login with Github"}
    </Button>
  )
}
export function GoogleLoginButton({...props}) {
  const [isLoading, setIsLoading] = React.useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()
  return (
    <Button
      variant="outline"
      onClick={async () => {
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({ 
          provider: 'google',
          options: {
            // TODO: FIX THIS FOR DEV, STAGING, PROD
            redirectTo: 'http://localhost:3000/auth/callback'
          }
        })
        if (error){
          console.error('Error signing in:', error.message)
          setIsLoading(false)
        }
        else router.push('/')
      }}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="mr-2 animate-spin" />
      ) : (
        <IconGoogle className="mr-2" />
      ) }
      {"Login with Google"}
    </Button>
  )
}
