import { Metadata } from 'next'

import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/react'

import '@/app/globals.css'
import { fontMono, fontSans } from '@/lib/fonts'
import { cn } from '@/lib/utils'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import dynamic from 'next/dynamic'

export const metadata: Metadata = {
  title: {
    default: 'Agentboard',
    template: `%s - Agentboard`
  },
  description: 'Try out AI agents in your browser',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  }
}

interface RootLayoutProps {
  children: React.ReactNode
}

const PostHogPageView = dynamic(() => import('../utils/posthog/client'), {
  ssr: false,
})

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          'font-sans antialiased',
          fontSans.variable,
          fontMono.variable
        )}
      >
        <Toaster />
        <Providers attribute="class" defaultTheme="dark" enableSystem>
          <div className="flex flex-col min-h-screen">
            {/* @ts-ignore */}
            <Header />
            <main className="flex flex-col flex-1 bg-muted/50">{children}</main>
            <PostHogPageView />
          </div>
          <TailwindIndicator />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
