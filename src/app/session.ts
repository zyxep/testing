import {sdk} from "@/lib/sdk"
import {UserSession} from "@/type"
import {getCookieHeader} from "@/app/action"

export async function getServerSession(): Promise<UserSession | null> {
  const cookie = await getCookieHeader()
  return sdk
    .toSession({
      cookie,
    }).then(async (session) => {
      const userSession: UserSession = {
        session: session,
        profile: undefined,
      }
      return userSession
    })
    .catch(() => null)
}