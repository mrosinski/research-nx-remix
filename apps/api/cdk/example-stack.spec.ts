import { App } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { CodeConfig } from 'aws-cdk-lib/aws-lambda'
import { SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs'
import { resolve } from 'node:path'
import { Environment } from '../shared/environment'
import { ExampleStack } from './example-stack'

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

describe('ExampleStack', () => {
  let app: App

  beforeEach(() => {
    app = new App()
  })

  describe('Given an ExampleStack,', () => {
    let stack: ExampleStack

    beforeEach(() => {
      stack = new ExampleStack(app, 'TestExampleStack', {
        environment: Environment.Dev,
        serviceName: 'Test',
        build: {
          minify: true,
          sourceMapMode: SourceMapMode.EXTERNAL,
          tsconfig: resolve(__dirname, '../tsconfig.src.json'),
        },
      })
    })

    test('an example Lambda function should be created.', () => {
      const template = Template.fromStack(stack)

      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.exampleHandler',
      })
    })
  })
})
