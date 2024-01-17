'use client'

import * as React from 'react'
import { redirect } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button} from '@/components/ui/button'
import { IconGitHub, IconSpinner, IconGoogle } from '@/components/ui/icons'

export function GithubLoginButton({ ...props}) {
  const supabase = createClientComponentClient()

  const [isLoading, setIsLoading] = React.useState(false)

  return (
    <Button
      variant="outline"
      onClick={async () => {
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({ 
          provider: 'github',
          options: {
            // TODO: FIX THIS FOR DEV, STAGING, PROD
            redirectTo: 'http://localhost:3000/auth/callback'
          }
        })
        if (error){
          console.error('Error signing in:', error.message)
          setIsLoading(false)
        }
        
        else redirect('/')

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
        else redirect('/')
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
