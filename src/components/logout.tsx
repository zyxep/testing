'use client'
import Link from 'next/link'
//import { getLogoutFlow } from '@/lib/sdk'

export const Logout = () => {
  //const flow = await getLogoutFlow({})
  console.log('logout button....')
  return (
    <Link href="/">
      Logout
    </Link>
  )
}
