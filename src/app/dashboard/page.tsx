import {redirect} from 'next/navigation'
import {getServerSession} from "@/app/session"

export default async function Dashboard() {
  const user = await getServerSession()

  if (!user?.session) {
    return redirect('/')
  } else {
    redirect('/dashboard/overview')
  }
}
