export enum Environment {
  Dev = 'Dev',
  Stage = 'Stage',
  Prod = 'Prod',
}

export const getProfile = (environment: Environment): string => {
  let profileEnv: string

  switch (environment) {
    case Environment.Dev:
      profileEnv = 'E2E_DEV_PROFILE'

      if (!process.env[profileEnv]) {
        throw new Error(
          `The '${profileEnv}' environment variable isn't defined. Please set it via the '.env.e2e' file in the project directory.`
        )
      }

      return process.env[profileEnv] as string
    case Environment.Stage:
      profileEnv = 'E2E_STAGE_PROFILE'

      if (!process.env[profileEnv]) {
        throw new Error(
          `The '${profileEnv}' environment variable isn't defined. Please set it via the '.env.e2e' file in the project directory.`
        )
      }

      return process.env[profileEnv] as string
    case Environment.Prod:
      profileEnv = 'E2E_PROD_PROFILE'

      if (!process.env[profileEnv]) {
        throw new Error(
          `The '${profileEnv}' environment variable isn't defined. Please set it via the '.env.e2e' file in the project directory.`
        )
      }

      return process.env[profileEnv] as string
    default:
      throw new Error(
        `Unknown environment '${environment}'. Please set it via the '.env.e2e' file in the project directory.`
      )
  }
}

export const getRegion = (environment: Environment): string => {
  let regionEnv: string

  switch (environment) {
    case Environment.Dev:
      regionEnv = 'E2E_DEV_REGION'

      if (!process.env[regionEnv]) {
        throw new Error(
          `The '${regionEnv}' environment variable isn't defined. Please set it via the '.env.e2e' file in the project directory.`
        )
      }

      return process.env[regionEnv] as string
    case Environment.Stage:
      regionEnv = 'E2E_STAGE_REGION'

      if (!process.env[regionEnv]) {
        throw new Error(
          `The '${regionEnv}' environment variable isn't defined. Please set it via the '.env.e2e' file in the project directory.`
        )
      }

      return process.env[regionEnv] as string
    case Environment.Prod:
      regionEnv = 'E2E_PROD_REGION'

      if (!process.env[regionEnv]) {
        throw new Error(
          `The '${regionEnv}' environment variable isn't defined. Please set it via the '.env.e2e' file in the project directory.`
        )
      }

      return process.env[regionEnv] as string
    default:
      throw new Error(
        `Unknown environment '${environment}'. Please set it via the '.env.e2e' file in the project directory.`
      )
  }
}
