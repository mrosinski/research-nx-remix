import { Stack, StackProps } from 'aws-cdk-lib'
import { NodejsFunction, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { Construct } from 'constructs'
import { resolve } from 'node:path'
import { Environment } from '../shared/environment'
import { createDefaultLambdaProps } from './default-lambda-props'
import { ExampleApiConstruct } from './example-api-construct'
import { toValidSsmParameterName } from './to-valid-ssm-parameter-name'

export interface ExampleStackProps extends StackProps {
  // Define stack properties here

  environment: Environment
  serviceName: string
  build: {
    minify: boolean
    sourceMapMode: SourceMapMode
    tsconfig: string
  }
}

export class ExampleStack extends Stack {
  constructor(scope: Construct, id: string, props: ExampleStackProps) {
    const { environment, serviceName, build, ...stackProps } = props

    super(scope, id, stackProps)

    // The code that defines your stack goes here

    // Example resources
    const exampleFunction = new NodejsFunction(this, 'ExampleFunction', {
      ...createDefaultLambdaProps({ environment, serviceName, build }),
      description: 'An example Lambda function.',
      entry: resolve(__dirname, '../src/example-handler.ts'),
      handler: 'exampleHandler',
    })

    /*
      The AWS CDK team recommends to use generated resource names (Use generated resource names, not physical names - https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html#best-practices-apps).
      In the case of a generated resource name, the Lambda function's name is only known after the CloudFormation template has been synthesized.
      Furthermore, the name changes per environment. To ease E2E testing, the name is stored as a SSM parameter.
    */
    new StringParameter(this, 'E2eExampleFunctionName', {
      parameterName: toValidSsmParameterName(`/e2e/${exampleFunction.node.path}`),
      stringValue: exampleFunction.functionName,
    })

    new ExampleApiConstruct(this, 'ExampleApiConstruct', {
      environment,
      serviceName,
      build,
    })
  }
}
