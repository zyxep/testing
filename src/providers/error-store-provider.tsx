'use client'

import {
  createErrorStore,
  type ErrorState,
  type ErrorStore,
  defaultErrorState
} from "@/stores/error-store"
import {createContext, type ReactNode, useContext, useRef} from "react"
import {useStore} from "zustand"

/** This is the type returned by createErrorStore(...) */
export type ErrorStoreApi = ReturnType<typeof createErrorStore>

/** A context for our vanilla store instance */
export const ErrorStoreContext = createContext<ErrorStoreApi | undefined>(
  undefined,
)

export interface ErrorStoreProviderProps {
  children: ReactNode
  /** Optional way to override initial error state if needed */
  initialState?: ErrorState
}

/**
 * The provider that gives access to a single instance
 * of the error store throughout the React tree.
 */
export const ErrorStoreProvider = ({
                                     children,
                                     initialState = defaultErrorState,
                                   }: ErrorStoreProviderProps) => {
  const storeRef = useRef<ErrorStoreApi>(null)
  if (!storeRef.current) {
    storeRef.current = createErrorStore(initialState)
  }

  return (
    <ErrorStoreContext.Provider value={storeRef.current}>
      {children}
    </ErrorStoreContext.Provider>
  )
}

/**
 * A convenience hook to consume the error store within React components.
 */
export const useErrorStore = <T, >(
  selector: (store: ErrorStore) => T,
): T => {
  const errorStoreContext = useContext(ErrorStoreContext)

  if (!errorStoreContext) {
    throw new Error('useErrorStore must be used within ErrorStoreProvider')
  }

  return useStore(errorStoreContext, selector)
}