'use client'

import {useErrorStore} from "@/providers/error-store-provider"
import {useEffect} from "react"
import {useToast} from "@/hooks/use-toast"
import {ToastAction} from "@/components/ui/toast"
import {useShallow} from "zustand/react/shallow"

interface ErrorHandlerClientProps {
  errorMessage: string
  errorType: number
}

export default function ErrorHandlerClient({
                                             errorMessage,
                                             errorType,
                                           }: ErrorHandlerClientProps) {
  // Grab the setError action from our store
  const setError = useErrorStore(useShallow((state) => state.setError))
  const {toast} = useToast()

  useEffect(() => {
    // 1. update the st ore
    setError(errorMessage, errorType)
    // 2. show a Sonner toast
    toast({
      variant: 'destructive',
      description: errorMessage,
      action: <ToastAction altText="Try again">Try again</ToastAction>,
    })
  }, [setError, errorMessage, errorType, toast])

  // return some fallback UI (or nothing at all)
  return null
}

export function ErrorToastSubscriber() {
  const {toast} = useToast()
  // Subscribe to the error store for changes
  const {message, type, clearError} = useErrorStore(useShallow((state) => ({
    message: state.message,
    type: state.type,
    clearError: state.clearError,
  })))

  useEffect(() => {
    if (type && message) {
      toast({
        variant: 'destructive',
        description: message,
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      })
      // Optionally clear so it doesn't show repeatedly
      clearError()
    }
  }, [message, type, clearError, toast])

  return null
}