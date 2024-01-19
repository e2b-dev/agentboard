'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { IconGitHub, IconSpinner, IconGoogle } from '@/components/ui/icons'
import { createClient } from '@/utils/supabase/client'

export function GithubLoginButton({ ...props}) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = React.useState(false)

  return (
    <Button
      variant="outline"
      onClick={async () => {
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
            options: {
              redirectTo: window.location.origin + '/auth/callback'
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
  const supabase = createClient()
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  return (
    <Button
      variant="outline"
      onClick={async () => {
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
            options: {
              redirectTo: window.location.origin + '/auth/callback'
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
