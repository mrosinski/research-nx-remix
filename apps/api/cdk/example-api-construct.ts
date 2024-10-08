import { Size } from 'aws-cdk-lib'
import {
  CfnDocumentationPart,
  EndpointType,
  JsonSchemaType,
  JsonSchemaVersion,
  LambdaIntegration,
  MethodLoggingLevel,
  RequestValidator,
  Resource,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway'
import {
  AllowedMethods,
  CacheCookieBehavior,
  CacheHeaderBehavior,
  CachePolicy,
  CacheQueryStringBehavior,
  CachedMethods,
  Distribution,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import { RestApiOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { NodejsFunction, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { Construct } from 'constructs'
import { resolve } from 'node:path'
import { Environment } from '../shared/environment'
import { createDefaultLambdaProps } from './default-lambda-props'
import { toValidSsmParameterName } from './to-valid-ssm-parameter-name'

export interface ExampleApiConstructProps {
  // Define construct properties here

  environment: Environment
  serviceName: string
  build: {
    minify: boolean
    sourceMapMode: SourceMapMode
    tsconfig: string
  }
}

export class ExampleApiConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ExampleApiConstructProps) {
    super(scope, id)

    // Define construct contents here

    // Example resources
    const exampleApiFunction = this.createExampleApiFunction(props)
    const exampleApi = this.createExampleApi()
    const exampleDistribution = this.createCloudFrontDistribution(exampleApi)
    const parameterRequestValidator = this.createParameterRequestValidator(exampleApi)

    this.createProductRoutes(exampleApi, exampleApiFunction, parameterRequestValidator)

    this.createDocumentation(exampleApi)

    /*
      The CloudFront distribution's domain name is only known after the CloudFormation template has been synthesized.
      Furthermore, the domain name changes per environment. To ease E2E testing, the domain name is stored as a SSM parameter.
    */
    new StringParameter(this, 'E2eExampleApiUrl', {
      parameterName: toValidSsmParameterName(`/e2e/${this.node.path}/url`),
      stringValue: `https://${exampleDistribution.distributionDomainName}`,
    })
  }

  private createExampleApiFunction(props: ExampleApiConstructProps): NodejsFunction {
    const { environment, serviceName, build } = props

    return new NodejsFunction(this, 'ExampleApiFunction', {
      ...createDefaultLambdaProps({ environment, serviceName, build }),
      description: 'An example API Lambda function.',
      entry: resolve(__dirname, '../src/example-api-handler.ts'),
      handler: 'exampleApiHandler',
    })
  }

  private createExampleApi(): RestApi {
    /*
     * Depending on the use case, it could make sense to use LambdaRestApi instead of RestApi.
     * Please note that a Lambda function could always be reused for multiple REST methods.
     */
    return new RestApi(this, 'ExampleApi', {
      cloudWatchRole: true,
      deployOptions: {
        stageName: 'default',
        loggingLevel: MethodLoggingLevel.INFO,
        tracingEnabled: true,
      },
      endpointTypes: [EndpointType.REGIONAL],
      minCompressionSize: Size.kibibytes(1),
    })
  }

  private createCloudFrontDistribution(exampleApi: RestApi): Distribution {
    const exampleCachePolicy = new CachePolicy(this, 'ExampleCachePolicy', {
      cookieBehavior: CacheCookieBehavior.none(),
      enableAcceptEncodingBrotli: true,
      enableAcceptEncodingGzip: true,
      headerBehavior: CacheHeaderBehavior.none(),
      queryStringBehavior: CacheQueryStringBehavior.all(),
    })

    const exampleResponseHeadersPolicy = new ResponseHeadersPolicy(this, 'ExampleResponseHeadersPolicy', {
      // CORS simple requests (https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests)
      corsBehavior: {
        accessControlAllowCredentials: false,
        accessControlAllowHeaders: ['Accept', 'Accept-Language', 'Content-Language', 'Content-Type', 'Range'],
        accessControlAllowMethods: ['GET', 'HEAD', 'POST'],
        accessControlAllowOrigins: ['*'],
        originOverride: false,
      },
    })

    return new Distribution(this, 'ExampleDistribution', {
      defaultBehavior: {
        origin: new RestApiOrigin(exampleApi),
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: exampleCachePolicy,
        cachedMethods: CachedMethods.CACHE_GET_HEAD,
        compress: false, // API Gateway already compresses the payload.
        responseHeadersPolicy: exampleResponseHeadersPolicy,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    })
  }

  private createParameterRequestValidator(exampleApi: RestApi): RequestValidator {
    return exampleApi.addRequestValidator('ParameterRequestValidator', {
      validateRequestBody: false,
      validateRequestParameters: true,
    })
  }

  private createProductRoutes(
    exampleApi: RestApi,
    exampleApiFunction: NodejsFunction,
    parameterRequestValidator: RequestValidator
  ): Resource {
    const productResource = exampleApi.root.addResource('product')

    /*
      The response model and the request parameters definition are used to describe the endpoint.
      If the REST API is exported as OpenAPI schema, then both are incorporated into the schema.
      On each request, the request parameters are validated. The response isn't validated.
      If a custom integration is being chosen, then the request and response validation can be implemented as desired
      (https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-integration-types.html).
     */
    const getProductResponseModel = exampleApi.addModel('ProductGetResponseModel', {
      contentType: 'application/json',
      schema: {
        schema: JsonSchemaVersion.DRAFT4,
        title: 'ProductGetResponse',
        type: JsonSchemaType.OBJECT,
        properties: {
          product: { type: JsonSchemaType.NUMBER },
        },
        required: ['product'],
        additionalProperties: false,
      },
    })
    productResource.addMethod('GET', new LambdaIntegration(exampleApiFunction), {
      requestValidator: parameterRequestValidator,
      requestParameters: {
        'method.request.querystring.a': true,
        'method.request.querystring.b': true,
      },
      methodResponses: [
        {
          statusCode: '200',
          responseModels: { 'application/json': getProductResponseModel },
        },
      ],
    })

    return productResource
  }

  private createDocumentation(exampleApi: RestApi): void {
    /*
      The documentation of the API is optional.
      The documentation parts are added to the OpenAPI export which can be tested in the SwaggerEditor (https://editor.swagger.io/).
      The SwaggerEditor can also be used to execute queries against the example API.
      The URL of the OpenAPI export should be changed to the URL of the CloudFront distribution.
      Please note that the documentation has to be published before it can be exported.
     */

    new CfnDocumentationPart(this, 'ExampleApiDoc', {
      location: {
        type: 'API',
      },
      properties: JSON.stringify({
        info: { description: 'An example API.' },
      }),
      restApiId: exampleApi.restApiId,
    })

    new CfnDocumentationPart(this, 'ProductGetDoc', {
      location: {
        type: 'METHOD',
        path: '/product',
        method: 'GET',
      },
      properties: JSON.stringify({
        description: 'Calculates the product of 2 numbers.',
      }),
      restApiId: exampleApi.restApiId,
    })

    new CfnDocumentationPart(this, 'ProductGetADoc', {
      location: {
        type: 'QUERY_PARAMETER',
        path: '/product',
        method: 'GET',
        name: 'a',
      },
      properties: JSON.stringify({
        description: 'The first number.',
      }),
      restApiId: exampleApi.restApiId,
    })

    new CfnDocumentationPart(this, 'ProductGetBDoc', {
      location: {
        type: 'QUERY_PARAMETER',
        path: '/product',
        method: 'GET',
        name: 'b',
      },
      properties: JSON.stringify({
        description: 'The second number.',
      }),
      restApiId: exampleApi.restApiId,
    })

    new CfnDocumentationPart(this, 'ProductGetResponseDoc', {
      location: {
        type: 'RESPONSE',
        path: '/product',
        method: 'GET',
        statusCode: '200',
      },
      properties: JSON.stringify({
        description: 'The calculation has been performed successfully.',
      }),
      restApiId: exampleApi.restApiId,
    })
  }
}
