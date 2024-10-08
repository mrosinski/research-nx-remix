import { App, Size, Stack } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { EndpointType, MethodLoggingLevel } from 'aws-cdk-lib/aws-apigateway'
import {
  AllowedMethods,
  CacheCookieBehavior,
  CacheHeaderBehavior,
  CacheQueryStringBehavior,
  CachedMethods,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import { CodeConfig } from 'aws-cdk-lib/aws-lambda'
import { SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs'
import { resolve } from 'node:path'
import { Environment } from '../shared/environment'
import { ExampleApiConstruct } from './example-api-construct'

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

describe('ExampleApiConstruct', () => {
  let app: App
  let stack: Stack

  beforeEach(() => {
    app = new App()
    stack = new Stack(app, 'TestStack')
  })

  describe('Given an ExampleApiConstruct,', () => {
    beforeEach(() => {
      new ExampleApiConstruct(stack, 'ExampleApiConstruct', {
        environment: Environment.Dev,
        serviceName: 'Test',
        build: {
          minify: true,
          sourceMapMode: SourceMapMode.EXTERNAL,
          tsconfig: resolve(__dirname, '../tsconfig.src.json'),
        },
      })
    })

    test('an example API Lambda function should be created.', () => {
      const template = Template.fromStack(stack)

      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.exampleApiHandler',
      })
    })

    test('an example API should be created.', () => {
      const template = Template.fromStack(stack)

      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        EndpointConfiguration: {
          Types: [EndpointType.REGIONAL],
        },
        MinimumCompressionSize: Size.kibibytes(1).toBytes(),
      })
    })

    test('a default stage should be created.', () => {
      const template = Template.fromStack(stack)

      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'default',
        MethodSettings: [
          {
            LoggingLevel: MethodLoggingLevel.INFO,
          },
        ],
        TracingEnabled: true,
      })
    })

    test('an example CloudFront cache policy should be created.', () => {
      const template = Template.fromStack(stack)

      template.hasResourceProperties('AWS::CloudFront::CachePolicy', {
        CachePolicyConfig: {
          ParametersInCacheKeyAndForwardedToOrigin: {
            CookiesConfig: {
              CookieBehavior: CacheCookieBehavior.none().behavior,
            },
            EnableAcceptEncodingBrotli: true,
            EnableAcceptEncodingGzip: true,
            HeadersConfig: {
              HeaderBehavior: CacheHeaderBehavior.none().behavior,
            },
            QueryStringsConfig: {
              QueryStringBehavior: CacheQueryStringBehavior.all().behavior,
            },
          },
        },
      })
    })

    test('an example CloudFront response headers policy should be created.', () => {
      const template = Template.fromStack(stack)

      template.hasResourceProperties('AWS::CloudFront::ResponseHeadersPolicy', {
        ResponseHeadersPolicyConfig: {
          CorsConfig: {
            AccessControlAllowCredentials: false,
            AccessControlAllowHeaders: {
              Items: ['Accept', 'Accept-Language', 'Content-Language', 'Content-Type', 'Range'],
            },
            AccessControlAllowMethods: { Items: ['GET', 'HEAD', 'POST'] },
            AccessControlAllowOrigins: { Items: ['*'] },
            OriginOverride: false,
          },
        },
      })
    })

    test('an example CloudFront distribution should be created.', () => {
      const template = Template.fromStack(stack)

      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            AllowedMethods: AllowedMethods.ALLOW_ALL.methods,
            CachedMethods: CachedMethods.CACHE_GET_HEAD.methods,
            Compress: false, // API Gateway already compresses the payload.
            ViewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          },
        },
      })
    })

    test('a single parameters validator should be created.', () => {
      const template = Template.fromStack(stack)

      template.resourcePropertiesCountIs(
        'AWS::ApiGateway::RequestValidator',
        {
          ValidateRequestBody: false,
          ValidateRequestParameters: true,
        },
        1
      )
    })

    test('the /product resource should be created.', () => {
      const template = Template.fromStack(stack)

      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'product',
      })
    })

    test('the API documentation should be created.', () => {
      const template = Template.fromStack(stack)

      template.hasResourceProperties('AWS::ApiGateway::DocumentationPart', {})
    })
  })
})
