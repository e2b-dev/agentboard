import {useState, useEffect} from 'react'
import { GithubLoginButton, GoogleLoginButton } from '@/components/login-button'
import { redirect } from 'next/navigation'
import { supabase } from '@/supabase'

export default async function SignInPage() {
  // const session = await auth()
  // // redirect to home if user is already logged in
  // if (session?.user) {
  //   redirect('/')
  // }

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession()
      if (data) {
        redirect('/')
      } else {
        setLoading(false)
      }
    }
    checkUser()

  }, [])

  return (
    loading ? <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] items-center justify-center py-10">Loading...</div> :
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] items-center justify-center py-10">
      <GoogleLoginButton />
      <GithubLoginButton />
    </div>
  )
}
