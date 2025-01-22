'use client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import GithubSignInButton from './github-auth-button'
import { handleFlowError, LoginFlow, UpdateLoginFlowBody } from '@ory/client-fetch'
import { HandleError, sdk } from '@/lib/sdk'
import { HandleErrors } from '@/lib/sdk-error'
import { ErrorToastSubscriber } from '@/components/error-handler-client'

const formSchema = z.object({
  username: z.string(),
  password: z.string(),
  csrf_token: z.string()
})

type UserFormValue = z.infer<typeof formSchema>;

export default function UserAuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [flow, setFlow] = useState<LoginFlow | null>(null)
  //const [serverError, setServerError] = useState<string | undefined>()
  const returnTo = String(searchParams.get('return_to') || '')
  const flowId = String(searchParams.get('flow') || '')
  // Refresh means we want to refresh the session. This is needed, for example, when we want to update the password
  // of a user.
  const refresh = Boolean(searchParams.get('refresh'))
  // AAL = Authorization Assurance Level. This implies that we want to upgrade the AAL, meaning that we want
  // to perform two-factor authentication/verification.
  const aal2 = String(searchParams.get('aal') || '')
  const [loading, startTransition] = useTransition()
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema)
  })

  // Get the flow based on the flowId in the URL (.e.g redirect to this page after flow initialized)
  const getFlow = (id: string) =>
    sdk
      // the flow data contains the form fields, error messages and csrf token
      .getLoginFlow({ id })
      .then((flow) => setFlow(flow))
      .catch(handleError)


  const handleError = HandleError(
    getFlow,
    setFlow,
    '/',
    true
  )

  const foo = HandleErrors(
    getFlow,
    setFlow,
    '/',
    true
  )


  // Create a new login flow
  const createFlow = (refresh: boolean, aal2: string, returnTo: string) =>
    sdk
      .createBrowserLoginFlow({
        refresh: true,
        aal: aal2 ? 'aal2' : 'aal1'
        //returnTo: returnTo,
      })
      // flow contains the form fields and csrf token
      .then((flow) => {
        // Set the flow data
        setFlow(flow)
        // Update URI query params to include flow id
        router.push(`/?flow=${flow.id}`)
      })
      .catch(handleFlowError)
  //.catch(handleError)

  const onSubmit = async (data: UserFormValue) => {
    // something unexpected went wrong and the flow was not set
    if (!flow) return router.push('/')

    const body = {
      csrf_token: data.csrf_token,
      identifier: data.username,
      method: 'password',
      password: data.password
    } as UpdateLoginFlowBody

    startTransition(() => {
      // we submit the flow to Ory with the form data
      sdk
        .updateLoginFlow({ flow: flow.id, updateLoginFlowBody: body })
        .then(() => {
          if (flow?.return_to) {
            window.location.href = flow?.return_to
            return
          }

          toast.success('Signed In Successfully!')
          router.push('/dashboard/overview')
        }).catch(foo)
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

  return flow ? (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-2"
        >
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    type="username"
                    placeholder="Enter your username..."
                    autoComplete="on"
                    required
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    required
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Input
            type="hidden"
            id="csrf_token"
            required
            value={
              flow?.ui.nodes.filter(
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                (v) => v.attributes.name === 'csrf_token'
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
              )[0].attributes.value
            }
            {...form.register('csrf_token')}
          />
          <Button disabled={loading} className="ml-auto w-full" type="submit">
            Login
          </Button>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <GithubSignInButton />
      <ErrorToastSubscriber />
    </>
  ) : (
    <div>Loading...</div>
  )
}
