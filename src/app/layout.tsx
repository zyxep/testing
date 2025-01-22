import Providers from '@/components/layout/providers'
import {Toaster} from '@/components/ui/toaster'
import type {Metadata} from 'next'
import {NuqsAdapter} from 'nuqs/adapters/next/app'
import {Lato} from 'next/font/google'
import NextTopLoader from 'nextjs-toploader'
import './globals.css'
import {getServerSession} from "@/app/session"
import {ErrorStoreProvider} from "@/providers/error-store-provider"

export const metadata: Metadata = {
  title: 'Next Shadcn',
  description: 'Basic dashboard with Next.js and Shadcn'
}

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap'
})

export default async function RootLayout({
                                           children
                                         }: {
  children: React.ReactNode;
}) {
  const session = await getServerSession()
  return (
    <html
      lang="en"
      className={`${lato.className}`}
      suppressHydrationWarning={true}
    >
    <body className={'overflow-hidden'}>
    <NextTopLoader showSpinner={false}/>
    <NuqsAdapter>
      <Providers session={session?.session}>
        <ErrorStoreProvider>
          <Toaster/>
          {children}
        </ErrorStoreProvider>
      </Providers>
    </NuqsAdapter>
    </body>
    </html>
  )
}
