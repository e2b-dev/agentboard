import { Metadata, Viewport } from 'next'

import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/react'

import '@/app/globals.css'
import { fontMono, fontSans } from '@/lib/fonts'
import { cn } from '@/lib/utils'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { Feedback } from "@/components/feedback";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'chatlio-widget': any
    }
  }
}
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ]
}

export const metadata: Metadata = {
  metadataBase: new URL(`https://www.agentboard.dev`),
  title: {
    default: 'Agentboard',
    template: `%s - Agentboard`
  },
  description: 'Use AI agents in the browser',

  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  },
  openGraph: {
    images: '/opengraph-image.png'
  }
}

interface RootLayoutProps {
  children: React.ReactNode
}

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
          <div className="flex min-h-screen flex-col">
            {/* @ts-ignore */}
            <Header />
            <main className="flex flex-1 flex-col bg-muted/50">{children}</main>
          </div>
          <TailwindIndicator />
        </Providers>
        <Analytics />
        <Feedback />
      </body>
    </html>
  )
}
