import Link from 'next/link'
import { getLogoutFlow } from '@/lib/sdk'

export const Logout = async () => {
  const flow = await getLogoutFlow({})
  return (
    <Link href={flow.logout_url}>
      Logout
    </Link>
  )
}
