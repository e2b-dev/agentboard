/* 
This component renders above the Chat component if there is no session, allowing the user to view the interface without interacting with it.
If the user clicks anywhere on the anon shield, a modal appears prompting them to sign in.
*/
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { GithubLoginButton, GoogleLoginButton } from '@/components/login-button'
export function AnonShield() {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)

  return (
    <>
      <div
        className="fixed inset-0 z-10 bg-transparent"
        onClick={() => setLoginDialogOpen(true)}
      />
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log in</DialogTitle>
          </DialogHeader>
          <DialogDescription>Log in to start chatting.</DialogDescription>
          <div className="flex h-20 flex-col items-center justify-center space-y-2 py-10">
            <GoogleLoginButton />
            <GithubLoginButton />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
