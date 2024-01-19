import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { GithubLoginButton, GoogleLoginButton } from '@/components/login-button'
import { createClient } from '@/utils/supabase/server'


export default async function SignInPage() {

  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const {data: {session}} = await supabase.auth.getSession()
  if (session) {
    redirect('/')
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] items-center justify-center py-10">
      <GoogleLoginButton />
      <GithubLoginButton />
    </div>
  )
}
