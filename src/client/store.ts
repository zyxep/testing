import { Session } from '@ory/client-fetch'
import { ProfileData } from '@/type'
import { createStore } from 'zustand'

export type SessionContextState = {
  /**
   * Whether the session is currently being loaded
   */
  isLoading: boolean
  /**
   * Whether the session is being loaded for the first time
   * Never true, if a session was passed to the provider
   */
  initialized: boolean
  /**
   * The current session or null if the user is not authenticated or an error occurred,
   * when fetching the session
   */
  session: Session | null | undefined
  /**
   * The custom user data
   */
  profile: ProfileData | null
  /**
   * The error that occurred when fetching the session if any
   */
  error: Error | undefined
}

export type SessionContextActions = {
  setSession: (session: Session | null | undefined) => void
  setProfile: (profile: ProfileData | null) => void
  setRefetch: () => void
}

export type SessionStore = SessionContextState & SessionContextActions

export const defaultInitState: Pick<SessionContextState, 'session' | 'profile' | 'error'> = {
  session: null,
  profile: null,
  error: undefined
}

export const createSessionContextStore = (
  initState: Pick<SessionContextState, 'session' | 'profile' | 'error'> = defaultInitState,
  refetcher: () => Promise<Session | undefined | null>
) => {
  return createStore<SessionStore>()((set) => ({
    ...initState,
    initialized: !!initState,
    isLoading: !!initState,
    setSession: () =>
      set((state: { session: Session | null | undefined }) => ({
        session: state.session
      })),
    setProfile: () =>
      set((state: { profile: ProfileData | null }) => ({
        profile: state.profile
      })),
    setRefetch: async () => {
      set(() => ({
        isLoading: true,
        error: undefined
      }))

      try {
        const session = await refetcher()
        set(() => ({
          isLoading: false,
          session: session
        }))
      } catch (e) {
        set(() => ({
          isLoading: false,
          error: e as Error
        }))
      }
    }
  }))
}