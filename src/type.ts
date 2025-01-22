import {Session} from "@ory/client-fetch"

export interface UserSession {
  session: Session | null
  profile: ProfileData | undefined
}

export interface ProfileData {
  profile_picture: string,
  country: string,
  city: string,
  zipcode: string,
  use_gravatar: boolean,
}