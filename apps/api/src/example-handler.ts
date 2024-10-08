import { Context } from 'aws-lambda'
import { ExampleEvent, ExampleResult } from './example-handler-types'
import { logger } from './logger'

/**
 * The entry point of the example Lambda function.
 */
export const exampleHandler = async (event: ExampleEvent, context: Context): Promise<ExampleResult> => {
  logger.addContext(context)

  logger.info('Example log message', { event, context })

  return {
    sum: event.a + event.b,
  }
}
