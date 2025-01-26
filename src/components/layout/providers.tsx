'use client'
import React from 'react'
import ThemeProvider from './ThemeToggle/theme-provider'

import { SessionContextProvider, SessionContextStoreProviderProps } from '@/client/new-session-provider'

export default function Providers({
                                    session,
                                    children
                                  }: {
  session: SessionContextStoreProviderProps['session'];
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SessionContextProvider session={session}
                                baseUrl={process.env.NEXT_PUBLIC_ORY_SDK_URL}>
          {children}
        </SessionContextProvider>
      </ThemeProvider>
    </>
  )
}
//import {SessionProvider, SessionProviderProps} from "@/client/session-provider"
//session: SessionProviderProps['session'];
//         <SessionProvider session={session} baseUrl={process.env.NEXT_PUBLIC_ORY_SDK_URL}>{children}</SessionProvider>