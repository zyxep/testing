'use client'

import {
  type SessionStore,
  createSessionContextStore
} from '@/client/store'
import { createContext, ReactNode, useCallback, useContext, useRef } from 'react'
import { useStore } from 'zustand'
import { Session } from '@ory/client-fetch'
import { frontendClient } from '@/client/frontendClient'

export type SessionContextApi = ReturnType<typeof createSessionContextStore>

export const SessionStoreContext = createContext<SessionContextApi | undefined>(undefined)

export interface SessionContextStoreProviderProps {
  session?: Session | null
  baseUrl?: string
  children: ReactNode
}

export const SessionContextProvider = ({
                                         session: initialSession,
                                         children,
                                         baseUrl
                                       }: SessionContextStoreProviderProps) => {
  const storeRef = useRef<SessionContextApi>(null)

  const fetchSessions = useCallback(async () => {
    return frontendClient({
      forceBaseUrl: baseUrl
    }).toSession()
  }, [baseUrl])

  if (!storeRef.current) {
    storeRef.current = createSessionContextStore(
      {
        session: initialSession,
        profile: null,
        error: undefined
      },
      fetchSessions
    )
  }

  return (
    <SessionStoreContext.Provider value={storeRef.current}>
      {children}
    </SessionStoreContext.Provider>
  )
}

export const useSessionContextStore = <T, >(
  selector: (store: SessionStore) => T
): T => {
  const sessionStoreContext = useContext(SessionStoreContext)

  if (!sessionStoreContext) {
    throw new Error('useSessionContextStore must be used within the session context')
  }

  return useStore(sessionStoreContext, selector)
}
