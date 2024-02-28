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

  const signIn = async (provider) => {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: provider,
      redirectTo: window.location.origin + '/auth/callback'
    })
    if (error) {
      console.error('Error signing in:', error.message)
      setIsLoading(false)
    }
    else {
      router.push('/')
    }
  }

  return (
    <Button
      variant="outline"
      onClick={() => signIn('github')}
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
      onClick={() => signIn('google')}
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
