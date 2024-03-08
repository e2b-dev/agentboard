'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { IconGitHub, IconSpinner, IconGoogle } from '@/components/ui/icons'
import { createClient } from '@/utils/supabase/client'

export function GithubLoginButton({ ...props }) {
  const supabase = createClient()
  const [isLoading, setIsLoading] = React.useState(false)

  return (
    <Button
      variant="outline"
      onClick={async (e) => {
        e.preventDefault()
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: window.location.origin + '/auth/callback'
          }
        })
        if (error) {
          console.error('Error signing in:', error.message)
          setIsLoading(false)
        }
      }}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="mr-2 animate-spin" />
      ) : (
        <IconGitHub className="mr-2" />
      )}
      {"Login with Github"}
    </Button>
  )
}
export function GoogleLoginButton({ ...props }) {
  const supabase = createClient()
  const [isLoading, setIsLoading] = React.useState(false)

  return (
    <Button
      variant="outline"
      onClick={async (e) => {
        e.preventDefault()
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/auth/callback'
          }
        })
        if (error) {
          console.error('Error signing in:', error.message)
          setIsLoading(false)
        }
      }}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="mr-2 animate-spin" />
      ) : (
        <IconGoogle className="mr-2" />
      )}
      {"Login with Google"}
    </Button>
  )
}
