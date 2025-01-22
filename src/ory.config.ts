import type {OryConfig} from "@ory/nextjs"

const config: OryConfig = {
  override: {
    applicationName: "Ory Next.js App Router Example",
    loginUiPath: "/",
    registrationUiPath: "/registration",
    recoveryUiPath: "/recovery",
    verificationUiPath: "/verification",
    settingsUiPath: "/settings",
    defaultRedirectUri: "/",
  },
}

export default config