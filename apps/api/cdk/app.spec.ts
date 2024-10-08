import { App, Stack } from 'aws-cdk-lib'
import { CodeConfig } from 'aws-cdk-lib/aws-lambda'
import { Environment } from '../shared/environment'
import { createApp } from './app'

// TODO Workaround that should be removed after https://github.com/aws/aws-cdk/issues/18125 has been solved.
jest.mock('aws-cdk-lib/aws-lambda', () => {
  const module = jest.requireActual<typeof import('aws-cdk-lib/aws-lambda')>('aws-cdk-lib/aws-lambda')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  module.Code.fromAsset = (path: string): any => ({
    path,
    isInline: false,
    bind: (): CodeConfig => {
      return {
        s3Location: {
          bucketName: 'bucketName',
          objectKey: 'objectKey',
        },
      }
    },
    bindToResource: () => undefined,
  })

  return module
})

describe('App', () => {
  describe('Given the default CDK environment variables extracted from the AWS profile,', () => {
    let app: App

    beforeEach(() => {
      process.env['CDK_DEFAULT_ACCOUNT'] = '012345678901'
      process.env['CDK_DEFAULT_REGION'] = 'us-east-1'

      delete process.env['CDK_DEV_ACCOUNT']
      delete process.env['CDK_DEV_REGION']

      delete process.env['CDK_STAGE_ACCOUNT']
      delete process.env['CDK_STAGE_REGION']

      delete process.env['CDK_PROD_ACCOUNT']
      delete process.env['CDK_PROD_REGION']
    })

    test('an app should be created with all environments.', () => {
      app = createApp()

      const children = app.node.children

      expect(children.map(construct => construct.node.id)).toEqual([
        Environment.Dev,

        Environment.Stage,

        Environment.Prod,
      ])
    })

    test('an app should be created with the correct environment accounts and regions.', () => {
      app = createApp()

      const children = app.node.children

      expect(
        children.map(construct => {
          const stack = construct.node.children[0] as Stack

          return {
            id: construct.node.id,
            account: stack.account,
            region: stack.region,
          }
        })
      ).toEqual([
        { id: Environment.Dev, account: '012345678901', region: 'us-east-1' },

        { id: Environment.Stage, account: '012345678901', region: 'us-east-1' },

        { id: Environment.Prod, account: '012345678901', region: 'us-east-1' },
      ])
    })
  })

  describe('Given a set of app-specific environment variables,', () => {
    let app: App

    beforeEach(() => {
      process.env['CDK_DEV_ACCOUNT'] = '123456789010'
      process.env['CDK_DEV_REGION'] = 'eu-west-1'

      process.env['CDK_STAGE_ACCOUNT'] = '123456789011'
      process.env['CDK_STAGE_REGION'] = 'eu-west-2'

      process.env['CDK_PROD_ACCOUNT'] = '123456789012'
      process.env['CDK_PROD_REGION'] = 'eu-west-3'

      delete process.env['CDK_DEFAULT_ACCOUNT']
      delete process.env['CDK_DEFAULT_REGION']
    })

    test('an app should be created with all environments.', () => {
      app = createApp()

      const children = app.node.children

      expect(children.map(construct => construct.node.id)).toEqual([
        Environment.Dev,

        Environment.Stage,

        Environment.Prod,
      ])
    })

    test('an app should be created with the correct environment accounts and regions.', () => {
      app = createApp()

      const children = app.node.children

      expect(
        children.map(construct => {
          const stack = construct.node.children[0] as Stack

          return {
            id: construct.node.id,
            account: stack.account,
            region: stack.region,
          }
        })
      ).toEqual([
        { id: Environment.Dev, account: '123456789010', region: 'eu-west-1' },

        { id: Environment.Stage, account: '123456789011', region: 'eu-west-2' },

        { id: Environment.Prod, account: '123456789012', region: 'eu-west-3' },
      ])
    })

    test('should throw an error if the CDK_DEV_ACCOUNT variable is missing during the creation.', () => {
      delete process.env['CDK_DEV_ACCOUNT']
      expect(() => createApp()).toThrow(Error)
    })

    test('should throw an error if the CDK_DEV_REGION variable is missing during the creation.', () => {
      delete process.env['CDK_DEV_REGION']
      expect(() => createApp()).toThrow(Error)
    })

    test('should throw an error if the CDK_STAGE_ACCOUNT variable is missing during the creation.', () => {
      delete process.env['CDK_STAGE_ACCOUNT']
      expect(() => createApp()).toThrow(Error)
    })

    test('should throw an error if the CDK_STAGE_REGION variable is missing during the creation.', () => {
      delete process.env['CDK_STAGE_REGION']
      expect(() => createApp()).toThrow(Error)
    })

    test('should throw an error if the CDK_PROD_ACCOUNT variable is missing during the creation.', () => {
      delete process.env['CDK_PROD_ACCOUNT']
      expect(() => createApp()).toThrow(Error)
    })

    test('should throw an error if the CDK_PROD_REGION variable is missing during the creation.', () => {
      delete process.env['CDK_PROD_REGION']
      expect(() => createApp()).toThrow(Error)
    })
  })
})
