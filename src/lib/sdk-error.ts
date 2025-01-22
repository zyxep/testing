'use client'

import {Dispatch, SetStateAction} from "react"
import {useErrorStore} from "@/providers/error-store-provider"
import {useShallow} from 'zustand/react/shallow'

export interface FetchError extends Error {
  response?: Response
  data?: any
}

export function HandleErrors(
  getFlow: ((flowId: string) => Promise<void | FetchError>) | undefined = undefined,
  setFlow: Dispatch<SetStateAction<any>> | undefined = undefined,
  defaultNav: string | undefined = undefined,
  fatalToError: boolean = false,
) {
  const setError = useErrorStore(useShallow((state) => state.setError))
  return async function (err: any) {
    const data = await err.response.json()

    /*if (!err.response || err.response.status === 0) {
      window.location.href = `/error?error=${encodeURIComponent(
        JSON.stringify(err.response),
      )}`
      return Promise.resolve()
    }*/

    switch (err.response.status) {
      case 400:
        console.log("code 400: " + data.ui.messages[0].text)
        setError(data.ui.messages[0].text, err.response.status)
        break
      case 410:
        console.log("code 410: " + data)
        setError(data.ui.messages[0].text, err.response.status)
        break
      case 422:
        console.log("code 422: " + data)
        setError(data.ui.messages[0].text, err.response.status)
        break
      default:
        console.log("anything else: " + data)
        setError(data.ui.messages[0].text, err.response.status)
        break
    }
  }
}