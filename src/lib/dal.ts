import 'server-only'
import {cache} from "react"
import {getServerSession} from "@/app/session"
import {redirect} from "next/navigation"

export const verifySession = cache(async () => {
  const user = await getServerSession()

  if (!user?.session) {
    redirect('/')
  }

  return user
})