import {createStore} from "zustand"

export type ErrorState = {
  message: string | null
  type: number | null // or string if y ou prefer
}

/** Actions that mutate your error state */
export type ErrorActions = {
  setError: (errorMessage: string, errorType: number) => void
  clearError: () => void
}

/** A unified store that merges state + actions */
export type ErrorStore = ErrorState & ErrorActions

/**
 * Default or initial state
 */
export const defaultErrorState: ErrorState = {
  message: null,
  type: null,
}

/**
 * Create the vanilla store using Zustand's createStore
 */
export const createErrorStore = (
  initState: ErrorState = defaultErrorState,
) => {
  return createStore<ErrorStore>()((set) => ({
    ...initState,
    setError: (errorMessage: string, errorType: number) => {
      set(() => ({
        message: errorMessage,
        type: errorType,
      }))
    },
    clearError: () => {
      set(() => ({
        message: null,
        type: null,
      }))
    },
  }))
}