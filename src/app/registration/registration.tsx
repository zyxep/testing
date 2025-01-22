'use client'

import Link from "next/link"
import {useCallback, useEffect, useState} from "react"
import {z} from 'zod'
import {zodResolver} from '@hookform/resolvers/zod'
import {redirect, useSearchParams, useRouter} from "next/navigation"
import {useForm} from 'react-hook-form'
import {cn} from "@/lib/utils"
import {Button, buttonVariants} from "@/components/ui/button"
import {Form, FormField} from '@/components/ui/form'
import {Label} from '@/components/ui/label'
import {Input} from '@/components/ui/input'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"

import {HandleError, sdk} from "@/lib/sdk"
import {RegistrationFlow, UpdateRegistrationFlowBody} from "@ory/client-fetch"

const formSchema = z
  .object({
    email: z.string(),
    username: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    csrf_token: z.string(),
    password: z.string(),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ['confirm'],
  })

export default function Registration() {
  const router = useRouter()
  const [flow, setFlow] = useState<RegistrationFlow>()
  const searchParams = useSearchParams()
  const returnTo = String(searchParams.get('return_to') || "")
  const flowId = String(searchParams.get('flow') || "")


  const getFlow = useCallback((id: string) =>
    sdk
      // the flow data contains the form fields, error messages and csrf token
      .getRegistrationFlow({id})
      .then((data) => {
        setFlow(data)
        router.push(`/registration?flow=${id}`)
      })
      .catch(handleError), [])

  const handleError = HandleError(
    getFlow,
    setFlow,
    "/registration",
    true
  )


  // create a new registration flow
  const createFlow = useCallback(
    (returnTo: string) =>
      sdk
        // we don't need to specify the return_to here since we are building an SPA. In server-side browser flows we would need to specify the return_to
        .createBrowserRegistrationFlow({returnTo})
        .then((flow) => {
          // Update URI query params to include flow id
          router.push(`/registration?flow=${flow.id}`)
          //setSearchParams({ ["flow"]: flow.id })
          // Set the flow data
          setFlow(flow)
        })
        .catch(handleError),
    [handleError],
  )

  // submit the registration form data to Ory
  const submitFlow = (values: z.infer<typeof formSchema>) => {
    const body = {
      method: 'password',
      csrf_token: values.csrf_token,
      password: values.password,
      traits: {
        email: values.email,
        username: values.username,
        name: {
          first: values.first_name,
          last: values.last_name,
        },
      },
    } as UpdateRegistrationFlowBody
    // something unexpected went wrong and the flow was not set
    if (!flow)
      return redirect('/registration')

    sdk
      .updateRegistrationFlow({
        flow: flow.id,
        updateRegistrationFlowBody: body,
      })
      .then((data) => {
        if ('continue_with' in data) {
          const body = {
            id: data.identity.id,
            country: '',
            city: '',
            zipcode: '',
          }
          fetch('http://localhost:8080/users', {method: 'POST', body: JSON.stringify(body)}).catch((err) => {
            console.log(err)
          })
          for (const cw of data.continue_with ?? []) {
            if (cw.action === 'show_verification_ui') {
              router.push(`/verification?flow=${cw.flow.id}`)
              return
            }
          }
        }

        // we successfully submitted the login flow, so lets redirect to the dashboard
        redirect('/')
      })
      .catch(HandleError)
  }

  useEffect(() => {
    // the flow already exists
    if (flowId) {
      getFlow(String(flowId) || "").catch(() => createFlow(returnTo)) // if for some reason the flow has expired, we need to get a new one
      return
    }
    // we assume there was no flow, so we create a new one
    createFlow(returnTo)
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      password: '',
      confirm: '',
    },
  })

  // the flow is not set yet, so we show a loading indicator
  return flow ? (
    <>
      <div
        className="container relative hidden h-[800px] flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <Link
          href="/"
          className={cn(
            buttonVariants({variant: 'ghost'}),
            'absolute right-4 top-4 md:right-8 md:top-8',
          )}
        >
          Login
        </Link>
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-zinc-900"/>
          <div className="relative z-20 flex items-center text-lg font-medium">
            <img
              src="/placeholder.svg"
              alt="Image"
              width="1920"
              height="1080"
              className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;This library has saved me countless hours of work and
                helped me deliver stunning designs to my clients faster than
                ever before.&rdquo;
              </p>
              <footer className="text-sm">Sofia Davis</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(submitFlow)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={() => (
                    <Card className="mx-auto max-w-sm">
                      <CardHeader className="flex flex-col space-y-2 text-center">
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                          Create an account
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                          Enter your email below to create your account
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
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="first-name">First name</Label>
                              <Input
                                id="first-name"
                                placeholder="Max"
                                required
                                {...form.register('first_name')}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="last-name">Last name</Label>
                              <Input
                                id="last-name"
                                placeholder="Robinson"
                                required
                                {...form.register('last_name')}
                              />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="email">Username</Label>
                            <Input
                              id="username"
                              type="username"
                              required
                              {...form.register('username')}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="m@example.com"
                              required
                              {...form.register('email')}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              required
                              {...form.register('password')}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="confirm">Repeat Password</Label>
                            <Input
                              id="confirm"
                              type="password"
                              required
                              {...form.register('confirm')}
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            Create an account
                          </Button>
                          {/*<Button variant="outline" className="w-full">
                    Sign up with GitHub
                  </Button>*/}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                />
              </form>
            </Form>
            <p className="px-8 text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our{' '}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  ) : (
    <div>Loading...</div>
  )
}