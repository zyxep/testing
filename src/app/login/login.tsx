'use client'

import {useCallback, useEffect, useState} from "react"
import {LoginFlow, UpdateLoginFlowBody} from "@ory/client-fetch"
import {HandleError, sdk} from "@/lib/sdk"
import {useRouter, useSearchParams} from "next/navigation"
import {z} from "zod"
import {useForm} from "react-hook-form"
import {Form, FormField} from "@/components/ui/form"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert'
import {ExclamationTriangleIcon} from '@radix-ui/react-icons'
//import {Icons} from '@/components/icons'
import {Button} from '@/components/ui/button'
import Link from "next/link"

export default function Login() {
  const router = useRouter()
  const [flow, setFlow] = useState<LoginFlow | null>(null)
  const [serverError, setServerError] = useState<string | undefined>()
  const searchParams = useSearchParams()
  const returnTo = String(searchParams.get('return_to') || "")
  const flowId = String(searchParams.get('flow') || "")
  // Refresh means we want to refresh the session. This is needed, for example, when we want to update the password
  // of a user.
  const refresh = Boolean(searchParams.get('refresh'))
  // AAL = Authorization Assurance Level. This implies that we want to upgrade the AAL, meaning that we want
  // to perform two-factor authentication/verification.
  const aal2 = String(searchParams.get('aal') || "")

  // Get the flow based on the flowId in the URL (.e.g redirect to this page after flow initialized)
  const getFlow = useCallback(
    (id: string) =>
      sdk
        // the flow data contains the form fields, error messages and csrf token
        .getLoginFlow({id})
        .then((flow) => setFlow(flow))
        .catch(handleError),
    [],
  )

  const handleError = HandleError(
    getFlow,
    setFlow,
    "/",
    true
  )

  const formSchema = z.object({
    username: z.string(),
    password: z.string(),
    csrf_token: z.string(),
  })

  // Create a new login flow
  const createFlow = useCallback(
    (refresh: boolean, aal2: string, returnTo: string) =>
      sdk
        .createBrowserLoginFlow({
          refresh: refresh,
          aal: aal2 ? 'aal2' : 'aal1',
          returnTo: returnTo,
        })
        // flow contains the form fields and csrf token
        .then((flow) => {
          // Set the flow data
          setFlow(flow)
          // Update URI query params to include flow id
          router.push(`/?flow=${flow.id}`)
        })
        .catch(handleError),
    [handleError]
  )

  // submit the login form data to Ory
  const submitFlow = (values: z.infer<typeof formSchema>) => {
    // something unexpected went wrong and the flow was not set
    if (!flow) return router.push('/')

    const body = {
      csrf_token: values.csrf_token,
      identifier: values.username,
      method: 'password',
      password: values.password,
    } as UpdateLoginFlowBody

    // we submit the flow to Ory with the form data
    sdk
      .updateLoginFlow({flow: flow.id, updateLoginFlowBody: body})
      .then(() => {
        if (flow?.return_to) {
          window.location.href = flow?.return_to
          return
        }

        router.push('/dashboard')
      })
      .catch((err) => {
        if (err.response && err.response.status === 400) {
          setServerError(
            err.response.data?.ui.messages[0].text || 'Something went wrong!',
          )
          //setServerError(flow?.ui?.messages?.filter(v => v.type)[0].text)
        }
      })
  }

  useEffect(() => {
    // the flow already exists
    if (flowId) {
      getFlow(flowId).catch(() => {
        createFlow(refresh, aal2, returnTo)
      })
      return
    }
    // we assume there was no flow, so we create a new one
    createFlow(refresh, aal2, returnTo)
  }, [])

  const form = useForm<z.infer<typeof formSchema>>()

  return flow ? (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submitFlow)} className="space-y-8">
          <FormField
            control={form.control}
            name="username"
            render={() => (
              <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
                <div className="flex items-center justify-center py-12">
                  <div className="mx-auto grid w-[350px] gap-6">
                    <div className="grid gap-2 text-center">
                      <h1 className="text-3xl font-bold">Login</h1>
                      <p className="text-balance text-muted-foreground">
                        Enter your email below to login to your account
                      </p>
                    </div>
                    <Input
                      type="hidden"
                      id="csrf_token"
                      required
                      value={
                        flow?.ui.nodes.filter(
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-expect-error
                          (v) => v.attributes.name === 'csrf_token',
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-expect-error
                        )[0].attributes.value
                      }
                      {...form.register('csrf_token')}
                    />
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          type="username"
                          autoComplete="on"
                          required
                          {...form.register('username')}
                        />
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-center">
                          <Label htmlFor="password">Password</Label>
                          <Link
                            href="/"
                            className="ml-auto inline-block text-sm underline"
                          >
                            Forgot your password?
                          </Link>
                        </div>
                        <Input
                          id="password"
                          type="password"
                          required
                          {...form.register('password')}
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Login
                      </Button>
                    </div>
                    {serverError && (
                      <Alert
                        variant="destructive"
                        className="text-red-600 border-red-600"
                      >
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-600"/>
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{serverError}</AlertDescription>
                      </Alert>
                    )}
                    <div className="mt-4 text-center text-sm">
                      Don&apos;t have an account?{' '}
                      <Link href="/" className="underline">
                        Sign up
                      </Link>
                      <Link href="/">Home</Link>
                    </div>
                  </div>
                </div>
                <div className="hidden bg-muted lg:block">
                  <img
                    src="/placeholder.svg"
                    alt="Image"
                    width="1920"
                    height="1080"
                    className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                  />
                </div>
              </div>
            )}
          />
        </form>
      </Form>
    </>
  ) : (
    <div>Loading...</div>
  )
}