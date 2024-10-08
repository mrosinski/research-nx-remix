import { Context } from 'aws-lambda'
import { createHash } from 'node:crypto'
import {
  ExampleApiEvent,
  ExampleApiEventParameters,
  ExampleApiResult,
  ExampleApiResultBody,
} from './example-api-handler-types'
import { logger } from './logger'

/**
 * The entry point of the example Lambda function.
 */
export const exampleApiHandler = async (event: ExampleApiEvent, context: Context): Promise<ExampleApiResult> => {
  logger.addContext(context)

  logger.info('Example log message', { event, context })

  const parameters = event.queryStringParameters as unknown as ExampleApiEventParameters

  const resultBody: ExampleApiResultBody = {
    product: Number.parseFloat(parameters.a) * Number.parseFloat(parameters.b),
  }
  const resultBodyString = JSON.stringify(resultBody)
  const resultBodyHash = createHash('sha512').update(resultBodyString).digest('base64url')

  return {
    statusCode: 200,
    headers: {
      'Cache-Control': 'public, max-age=60',
      ETag: resultBodyHash,
    },
    body: resultBodyString,
  }
}
