//import 'server-only'

import { Configuration, FrontendApi, LogoutFlow } from '@ory/client-fetch'
import { redirect } from 'next/navigation'
import { Dispatch, SetStateAction } from 'react'
import { getCookieHeader } from '@/app/action'
import { FetchError } from '@/lib/sdk-error'


export const sdk = new FrontendApi(
  new Configuration({
    basePath: process.env.NEXT_PUBLIC_ORY_SDK_URL,
    credentials: 'include',
    headers: {
      //Origin: String(getHeaders()),
      Accept: 'application/json'
    }
  })
)

//export interface FetchError extends Error {
//  response?: Response
//  data?: any
//}

/*export interface SDKErrorParams {
  getFlow: ((flowId: string) => Promise<void | FetchError>) | undefined,
  setFlow: React.Dispatch<React.SetStateAction<any>> | undefined,
  defaultNav: string | undefined,
  fatalToError: boolean,
}*/

/*export function HandleError(
  {
    getFlow,
    setFlow,
    defaultNav,
    fatalToError = false,
  }: SDKErrorParams) {*/


/*export function HandleErrors(
  getFlow: ((flowId: string) => Promise<void | FetchError>) | undefined = undefined,
  setFlow: Dispatch<SetStateAction<any>> | undefined = undefined,
  defaultNav: string | undefined = undefined,
  fatalToError: boolean = false,
) {
  return async function (err: any) {
    const data = await err.response.json()

    if (!err.response || err.response.status === 0) {
      window.location.href = `/error?error=${encodeURIComponent(
        JSON.stringify(err.response),
      )}`
      return Promise.resolve()
    }

    switch (err.response.status) {
      case 400:
        return {message: data.messages[0].text, status: err.response.status}
      case 410:
        return {message: data.messages[0].text, status: err.response.status}
      case 422:
        return {message: data.messages[0].text, status: err.response.status}
      default:
        return {message: data.messages[0].text, status: err.response.status}
    }
  }
}*/

/*export const HandleErrors = async (err: any) => {
  console.log(err.response.status)
  const data = await err.response.json()
  console.log(data)
}*/


export const HandleError = (
  getFlow: ((flowId: string) => Promise<void | FetchError>) | undefined = undefined,
  setFlow: Dispatch<SetStateAction<any>> | undefined = undefined,
  defaultNav: string | undefined = undefined,
  fatalToError: boolean = false
) => {
  return async (error: FetchError | Error): Promise<FetchError | void> => {
    const responseData = (error as FetchError).data || {}
    if ('response' in error && error.response) {
      if (!error.response || error.response.status === 0) {
        window.location.href = `/error?error=${encodeURIComponent(
          JSON.stringify(error.response)
        )}`
        return Promise.resolve()
      }

      const data = await responseData.json()
      console.log(data)

      //const responseData = error.response?.data || {}

      switch (error.response.status) {
        case 400: {
          //console.error(error.response)
          //console.log(responseData.message)
          //if (error.data?.error.id == "session_already_available") {
          console.log(responseData)
          //console.log(responseData.error)
          if (error.data.id == 'session_already_available') {
            //await Router.push("/")
            redirect('/')
            return Promise.resolve()
          }

          // the request could contain invalid parameters which would set error messages in the flow
          if (setFlow !== undefined) {
            console.warn('sdkError 400: update flow data')
            setFlow(responseData)
            return Promise.resolve()
          }
          break
        }
        // we have no session or the session is invalid
        case 401: {
          console.warn('handleError hook 401: Navigate to /')
          redirect('/')
          //await Router.push("/")
          return Promise.resolve()
        }
        case 403: {
          // the user might have a session, but would require 2FA (Two-Factor Authentication)
          if (responseData.error?.id === 'session_aal2_required') {
            redirect('/?aal2=true')
            return Promise.resolve()
          }

          if (
            responseData.error?.id === 'session_refresh_required' &&
            responseData.redirect_browser_to
          ) {
            console.warn(
              'sdkError 403: Redirect browser to',
              responseData.redirect_browser_to
            )
            window.location = responseData.redirect_browser_to
            return Promise.resolve()
          }
          break
        }
        case 404: {
          console.warn('sdkError 404: Navigate to Error')
          const errorMsg = {
            data: responseData || error,
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: window.location.href
          }

          redirect(
            `/error?error=${encodeURIComponent(JSON.stringify(errorMsg))}`
          )
          return Promise.resolve()
        }
        // error.id handling
        //    "self_service_flow_expired"
        case 410: {
          if (getFlow !== undefined && responseData.use_flow_id !== undefined) {
            console.warn('sdkError 410: Update flow')
            return getFlow(responseData.use_flow_id).catch((error) => {
              // Something went seriously wrong - log and redirect to defaultNav if possible
              console.error(error)

              if (defaultNav !== undefined) {
                redirect(defaultNav)
              } else {
                // Rethrow error when can't navigate and let caller handle
                throw error
              }
            })
          } else if (defaultNav !== undefined) {
            console.warn('sdkError 410: Navigate to', defaultNav)
            redirect(defaultNav)
            return Promise.resolve()
          }
          break
        }
        // we need to parse the response and follow the `redirect_browser_to` URL
        // this could be when the user needs to perform a 2FA challenge
        // or passwordless login
        case 422: {
          if (responseData.redirect_browser_to !== undefined) {
            const currentUrl = new URL(window.location.href)
            const redirectData = new URL(responseData.redirect_browser_to)

            // host name has changed, then change location
            if (currentUrl.host !== redirectData.host) {
              console.warn('sdkError 422: Host changed redirect')
              window.location = responseData.redirect_browser_to
              return Promise.resolve()
            }

            // Path has changed
            if (currentUrl.pathname !== redirectData.pathname) {
              console.warn('sdkError 422: Update path')
              const url = redirectData.pathname + redirectData.search
              redirect(url)
              return Promise.resolve()
            }

            // for webauthn we need to reload the flow
            const flowId = redirectData.searchParams.get('flow')

            if (flowId != null && getFlow !== undefined) {
              // get new flow data based on the flow id in the redirect url
              console.warn('sdkError 422: Update flow')
              return getFlow(flowId).catch((error) => {
                // Something went seriously wrong - log and redirect to defaultNav if possible
                console.error(error)

                if (defaultNav !== undefined) {
                  redirect(defaultNav)
                } else {
                  // Rethrow error when can't navigate and let caller handle
                  throw error
                }
              })
            } else {
              console.warn('sdkError 422: Redirect browser to')
              window.location = responseData.redirect_browser_to
              return Promise.resolve()
            }
          }
        }
      }

      console.error(error)

      if (fatalToError) {
        console.warn('sdkError: fatal error redirect to /error')
        redirect(`/error?error=${JSON.stringify(error, null, 2)}&id=${responseData.error?.id}`)
        return Promise.resolve()
      }

      throw error
    }
  }
}


// Returns a function which will log the user out
export async function getLogoutFlow({
                                      returnTo
                                    }: { returnTo?: string } = {}): Promise<LogoutFlow> {
  const cookie = await getCookieHeader()
  return sdk.createBrowserLogoutFlow({
    cookie,
    returnTo
  })
    .then((v: LogoutFlow): LogoutFlow => v)
}

/*
'use client'

import {Configuration, FrontendApi} from "@ory/kratos-client-fetch"
import React from "react"
import {redirect} from "next/navigation"

export const sdk = new FrontendApi(
  new Configuration({
    //https://vitejs.dev/guide/env-and-mode.html#env-files
    basePath: process.env.VITE_ORY_SDK_URL,
    credentials: 'include'
    // we always want to include the cookies in each request
    // cookies are used for sessions and CSRF protection
    //baseOptions: {
    //  withCredentials: true,
    //},
  }),
)

export interface FetchError extends Error {
  response?: Response
  data?: any
}

export interface SDKErrorParams {
  getFlow?: ((flowId: string) => Promise<void | FetchError>) | undefined,
  setFlow?: React.Dispatch<React.SetStateAction<any>> | undefined,
  defaultNav?: string | undefined,
  fatalToDash?: boolean,
}

export function sdkError(
  {
    getFlow,
    setFlow,
    defaultNav,
    fatalToDash = false,
  }: SDKErrorParams) {

  return async (error: FetchError | Error): Promise<FetchError | void> => {
    const responseData = (error as FetchError).data || {}

    if ("response" in error && error.response) {

      switch (error.response.status) {
        case 400: {
          //if (error.response.data?.error?.id === "session_already_available") {
          if (error.data.error.id === "session_already_available") {
            console.warn(
              "sdkError 400: `session_already_available`. Navigate to /",
            )
            await redirect("/")
            return Promise.resolve()
          }
          // the request could contain invalid parameters which would set error messages in the flow
          if (setFlow !== undefined) {
            console.warn("sdkError 400: update flow data")
            setFlow(responseData)
            return Promise.resolve()
          }
          break
        }
        case 401: {
          console.warn("sdkError 401: Navigate to /")
          await redirect("/")
          return Promise.resolve()
        }
        case 403: {
          // the user might have a session, but would require 2FA (Two-Factor Authentication)
          if (responseData.error?.id === "session_aal2_required") {
            await redirect("/")
            return Promise.resolve()
          }

          if (
            responseData.error?.id === "session_refresh_required" &&
            responseData.redirect_browser_to
          ) {
            console.warn("sdkError 403: Redirect browser to")
            window.location = responseData.redirect_browser_to
            return Promise.resolve()
          }
          break
        }
        case 404: {
          if (defaultNav !== undefined) {
            console.warn("sdkError 404: Navigate to Error")
            const errorMsg = {
              //data: error.response?.data || error,
              data: responseData.data || error,
              status: error.response?.status,
              statusText: error.response?.statusText,
              url: window.location.href,
            }

            await redirect("/")
            /!*await redirect({

                to: "/",
                search: {
                  "error": `${encodeURIComponent(JSON.stringify(errorMsg))}`
                },
                replace: true,
              },
            )*!/
            return Promise.resolve()
          }
          break
        }
        case 410: {
          if (getFlow !== undefined && responseData.use_flow_id !== undefined) {
            console.warn("sdkError 410: Update flow")
            return await getFlow(responseData.use_flow_id).catch((error) => {
              // Something went seriously wrong - log and redirect to defaultNav if possible
              console.log(error)

              if (defaultNav !== undefined) {
                redirect(defaultNav)
              } else {
                // Rethrow error when can't navigate and let caller handle
                throw error
              }
            })
          } else if (defaultNav !== undefined) {
            console.warn("sdkError 410: Navigate to", defaultNav)
            await redirect(defaultNav)
            return Promise.resolve()
          }
          break
        }
        case 422: {
          if (responseData.redirect_browser_to !== undefined) {
            const currentUrl = new URL(window.location.href)
            const redirect = new URL(
              responseData.redirect_browser_to,
              // need to add the base url since the `redirect_browser_to` is a relative url with no hostname
              window.location.origin,
            )

            // Path has changed
            if (currentUrl.pathname !== redirect.pathname) {
              console.warn("sdkError 422: Update path")
              // remove /ui prefix from the path in case it is present (not setup correctly inside the project config)
              // since this is an SPA we don't need to redirect to the Account Experience.
              redirect.pathname = redirect.pathname.replace("/ui", "")
              await redirect(redirect.pathname + redirect.search)
              return Promise.resolve()
            }

            // for webauthn we need to reload the flow
            const flowId = redirect.searchParams.get("flow")

            if (flowId != null && getFlow !== undefined) {
              // get new flow data based on the flow id in the redirect url
              console.warn("sdkError 422: Update flow")
              try {
                return await getFlow(flowId)
              } catch (error) {
                // Something went seriously wrong - log and redirect to defaultNav if possible
                console.error(error)

                if (defaultNav !== undefined) {
                  redirect(defaultNav)
                } else {
                  // Rethrow error when can't navigate and let caller handle
                  throw error
                }
              }
            } else {
              console.warn("sdkError 422: Redirect browser to")
              window.location = responseData.redirect_browser_to
              return Promise.resolve()
            }
          }
        }
      }
    }

    console.error(error)

    if (fatalToDash) {
      console.warn("sdkError: fatal error redirect to dashboard")
      await redirect("/")
      return Promise.resolve()
    }

    throw error
  }
}*/
