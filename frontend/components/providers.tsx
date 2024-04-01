'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'

import { TooltipProvider } from '@/components/ui/tooltip'
import { AgentContextProvider } from '@/lib/hooks/use-agent'

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <TooltipProvider>
        <AgentContextProvider>{children}</AgentContextProvider>
      </TooltipProvider>
    </NextThemesProvider>
  )
}
