'use server'
import { headers } from 'next/headers'

export async function getCookieHeader() {
  console.log('getting cookies.....')
  // eslint-disable-next-line @typescript-eslint/await-thenable -- types in the next SDK are wrong?
  const h = await headers()
  return h.get('cookie') ?? undefined
}