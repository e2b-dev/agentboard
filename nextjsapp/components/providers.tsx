'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

import { TooltipProvider } from '@/components/ui/tooltip'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false // Disable automatic pageview capture, as we capture manually
  })
}

export function PHProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
      <NextThemesProvider {...props}>
        <TooltipProvider>
          <PHProvider>{children}</PHProvider>
        </TooltipProvider>
      </NextThemesProvider>
  )
}
