import { App, Tags } from 'aws-cdk-lib'
import { SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Construct } from 'constructs'
import { resolve } from 'node:path'
import 'source-map-support/register'
import { Environment } from '../shared/environment'
import { ExampleStack, ExampleStackProps } from './example-stack'
import { toValidTag } from './to-valid-tag'

export const createApp = (): App => {
  /*
    The AWS CDK team recommends to declare all stacks of all environments in the source code (Model all production stages in code - https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html#best-practices-apps).
    This guide explains the approach in more detail (https://taimos.de/blog/deploying-your-cdk-app-to-different-stages-and-environments).
    Environment variables are used to fixate the account and region at synthesis time (https://docs.aws.amazon.com/cdk/v2/guide/environments.html).
    They can be set via the '.env' file or via the shell in use.
  */

  const app = new App()
  const serviceName = 'api'

  const devAccount = process.env['CDK_DEV_ACCOUNT'] ?? process.env['CDK_DEFAULT_ACCOUNT']
  if (!devAccount) {
    throw new Error(`The Dev account isn't defined. Please set it via the '.env' file in the project directory.`)
  }

  const devRegion = process.env['CDK_DEV_REGION'] ?? process.env['CDK_DEFAULT_REGION']
  if (!devRegion) {
    throw new Error(`The Dev region isn't defined. Please set it via the '.env' file in the project directory.`)
  }

  new EnvironmentStacks(app, Environment.Dev, {
    environment: Environment.Dev,
    serviceName,
    env: {
      account: devAccount,
      region: devRegion,
    },
    build: {
      minify: false,
      sourceMapMode: SourceMapMode.INLINE,
      tsconfig: resolve(__dirname, '../tsconfig.src.json'),
    },
  })

  const stageAccount = process.env['CDK_STAGE_ACCOUNT'] ?? process.env['CDK_DEFAULT_ACCOUNT']
  if (!stageAccount) {
    throw new Error(`The Stage account isn't defined. Please set it via the '.env' file in the project directory.`)
  }

  const stageRegion = process.env['CDK_STAGE_REGION'] ?? process.env['CDK_DEFAULT_REGION']
  if (!stageRegion) {
    throw new Error(`The Stage region isn't defined. Please set it via the '.env' file in the project directory.`)
  }

  new EnvironmentStacks(app, Environment.Stage, {
    environment: Environment.Stage,
    serviceName,
    env: {
      account: stageAccount,
      region: stageRegion,
    },
    build: {
      minify: true,
      /*
        Source maps bloat the Lambda bundle, which leads to longer cold start times.
        Therefore, it is preferable to
        1. Run the 'cdk synth' command.
        2. Upload the source maps to an error monitoring tool like Sentry.
        3. Remove the source maps.
        4. Run the 'cdk deploy --app cdk.out' command to skip the synthesize step during the deployment.
       */
      sourceMapMode: SourceMapMode.EXTERNAL,
      tsconfig: resolve(__dirname, '../tsconfig.src.json'),
    },
  })

  const prodAccount = process.env['CDK_PROD_ACCOUNT'] ?? process.env['CDK_DEFAULT_ACCOUNT']
  if (!prodAccount) {
    throw new Error(`The Prod account isn't defined. Please set it via the '.env' file in the project directory.`)
  }

  const prodRegion = process.env['CDK_PROD_REGION'] ?? process.env['CDK_DEFAULT_REGION']
  if (!prodRegion) {
    throw new Error(`The Prod region isn't defined. Please set it via the '.env' file in the project directory.`)
  }

  new EnvironmentStacks(app, Environment.Prod, {
    environment: Environment.Prod,
    serviceName,
    env: {
      account: prodAccount,
      region: prodRegion,
    },
    build: {
      minify: true,
      /*
        Source maps bloat the Lambda bundle, which leads to longer cold start times.
        Therefore, it is preferable to
        1. Run the 'cdk synth' command.
        2. Upload the source maps to an error monitoring tool like Sentry.
        3. Remove the source maps.
        4. Run the 'cdk deploy --app cdk.out' command to skip the synthesize step during the deployment.
       */
      sourceMapMode: SourceMapMode.EXTERNAL,
      tsconfig: resolve(__dirname, '../tsconfig.src.json'),
    },
  })

  return app
}

export type EnvironmentStacksProps = ExampleStackProps

export class EnvironmentStacks extends Construct {
  constructor(scope: Construct, id: string, props: EnvironmentStacksProps) {
    const { environment, serviceName } = props

    super(scope, id)

    const exampleStack = new ExampleStack(
      this,
      `${serviceName.slice(0, 1).toUpperCase()}${serviceName.slice(1)}`,
      props
    )

    Tags.of(exampleStack).add('Environment', toValidTag(environment))
    Tags.of(exampleStack).add('App', toValidTag(serviceName))
  }
}
