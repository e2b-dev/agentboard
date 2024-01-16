'use client'

import * as React from 'react'
import { signIn } from 'next-auth/react'

import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'
import { IconGitHub, IconSpinner, IconGoogle } from '@/components/ui/icons'
import { supabase } from '@/supabase'
import { redirect } from 'next/navigation'

interface GithubLoginButtonProps extends ButtonProps {
  showGithubIcon?: boolean
  text?: string
}
interface GoogleLoginButtonProps extends ButtonProps {
  showGoogleIcon?: boolean
  text?: string
}

export function GithubLoginButton({
  text = 'Login with GitHub',
  showGithubIcon = true,
  className,
  ...props
}: GithubLoginButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  return (
    <Button
      variant="outline"
      onClick={async () => {
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' })
        if (error){
          console.error('Error signing in:', error.message)
          setIsLoading(false)
        }
        else redirect('/')

      }}
      disabled={isLoading}
      className={cn(className)}
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="mr-2 animate-spin" />
      ) : showGithubIcon ? (
        <IconGitHub className="mr-2" />
      ) : null}
      {text}
    </Button>
  )
}
export function GoogleLoginButton({
  text = 'Login with Google',
  showGoogleIcon = true,
  className,
  ...props
}: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  return (
    <Button
      variant="outline"
      onClick={async () => {
        setIsLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
        if (error){
          console.error('Error signing in:', error.message)
          setIsLoading(false)
        }
        else redirect('/')
      }}
      disabled={isLoading}
      className={cn(className)}
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="mr-2 animate-spin" />
      ) : showGoogleIcon ? (
        <IconGoogle className="mr-2" />
      ) : null}
      {text}
    </Button>
  )
}
