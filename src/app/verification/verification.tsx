'use client'

import {useRouter, useSearchParams} from "next/navigation"
import {useCallback, useEffect, useState} from "react"
import {UpdateVerificationFlowBody, VerificationFlow} from "@ory/client-fetch"
import {HandleError, sdk} from "@/lib/sdk"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import Link from "next/link"
import {Button} from "@/components/ui/button"
import {Form, FormControl, FormField} from "@/components/ui/form"
import {InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot} from "@/components/ui/input-otp"
import {Label} from "@/components/ui/label"
import {Input} from "@/components/ui/input"
import {RocketIcon} from '@radix-ui/react-icons'
import {REGEXP_ONLY_DIGITS} from "input-otp"

export default function Verification() {
  const router = useRouter()
  const [flow, setFlow] = useState<VerificationFlow | null>(null)
  const searchParams = useSearchParams()
  const returnTo = String(searchParams.get('return_to') || "")
  const flowId = String(searchParams.get('flow') || "")
  const code = String(searchParams.get('code') || "")

  const formSchema = z.object({
    code: z.string(),
    csrf_token: z.string(),
  })

  // Get the flow based on the flowId in the URL (.e.g redirect to this page after flow initialized)
  const getFlow = useCallback(
    (id: string) =>
      sdk
        // the flow data contains the form fields, error messages and csrf token
        .getVerificationFlow({id})
        .then((flow) => setFlow(flow))
        .catch(handleError),
    [],
  )

  const handleError = HandleError(
    getFlow,
    setFlow,
    "/verification",
    true
  )

  // Create a new login flow
  const createFlow = useCallback(
    (returnTo: string) =>
      sdk
        .createBrowserVerificationFlow({
          returnTo: returnTo,
        })
        // flow contains the form fields and csrf token
        .then((flow) => {
          // Set the flow data
          setFlow(flow)
          // Update URI query params to include flow id
          router.push(`/verification?flow=${flow.id}`)
        })
        .catch(handleError),
    [handleError]
  )

  // submit the login form data to Ory
  const submitFlow = (values: z.infer<typeof formSchema>) => {
    // something unexpected went wrong and the flow was not set
    if (!flow) return router.push('/verification')

    const body = {
      code: values.code,
      csrf_token: values.csrf_token,
      method: 'code',
    } as UpdateVerificationFlowBody

    // we submit the flow to Ory with the form data
    sdk
      .updateVerificationFlow({flow: flow.id, updateVerificationFlowBody: body})
      .then(() => {
        if (flow?.return_to) {
          window.location.href = flow?.return_to
          return
        }
        //sleep(500)
        router.push('/dashboard')
      })
      .catch(handleError)
  }

  useEffect(() => {
    // the flow already exists
    if (flowId) {
      getFlow(flowId).catch(() => {
        createFlow(returnTo)
      })
      return
    }

    // we assume there was no flow, so we create a new one
    createFlow(returnTo)
  }, [])

  const form = useForm<z.infer<typeof formSchema>>()

  return flow ? (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submitFlow)} className="space-y-8">
          <FormField
            control={form.control}
            name="code"
            render={({field}) => (
              <Card className="mx-auto max-w-sm">
                {flow?.state != 'passed_challenge' ? (
                  <>
                    <CardHeader className="flex flex-col space-y-2 text-center">
                      <CardTitle className="text-2xl font-semibold tracking-tight">
                        Verify your account
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        An email containing a verification code has been sent
                        to the email address you provided. If you have not
                        received an email, check the spelling of the address
                        and make sure to use the address you registered with.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Label htmlFor="csrf_token"/>
                      <Input
                        type="hidden"
                        id="csrf_token"
                        required
                        value={
                          flow.ui.nodes.filter(
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
                          <Label htmlFor="code">Verification code *</Label>
                          <FormControl>
                            <InputOTP
                              id="code"
                              maxLength={6}
                              pattern={REGEXP_ONLY_DIGITS}
                              {...field}
                            >
                              <InputOTPGroup>
                                <InputOTPSlot index={0}/>
                                <InputOTPSlot index={1}/>
                                <InputOTPSlot index={2}/>
                              </InputOTPGroup>
                              <InputOTPSeparator/>
                              <InputOTPGroup>
                                <InputOTPSlot index={3}/>
                                <InputOTPSlot index={4}/>
                                <InputOTPSlot index={5}/>
                              </InputOTPGroup>
                            </InputOTP>
                          </FormControl>
                        </div>
                        <Button type="submit" className="w-full">
                          Create an account
                        </Button>
                      </div>
                      <div className="mt-4 text-center text-sm">
                        Don't have an account?{' '}
                        <Link href="#" className="underline">
                          Sign up
                        </Link>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <>
                    <Alert>
                      <RocketIcon className="h-4 w-4"/>
                      <AlertTitle>Verify your account</AlertTitle>
                      <AlertDescription className="text-sm text-muted-foreground text-green-400	">
                        {flow.ui.messages?.[0].text}
                      </AlertDescription>
                      <CardContent className="flex flex-col space-y-2 text-center">
                        <Link
                          href={
                            flow.ui.nodes.filter(
                              (v) => v.attributes.node_type === 'a',
                              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                              // @ts-expect-error
                            )[0].attributes.href
                          }
                        >
                          Continue
                        </Link>
                      </CardContent>
                    </Alert>
                  </>
                )}
              </Card>
            )}
          />
        </form>
      </Form>
    </>
  ) : (
    <div>Loading...</div>
  )
}