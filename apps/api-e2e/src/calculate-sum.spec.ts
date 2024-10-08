import { InvocationType, InvokeCommand, InvokeCommandInput, LambdaClient, LogType } from '@aws-sdk/client-lambda'
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'
import { fromSSO } from '@aws-sdk/credential-providers'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Environment, getProfile, getRegion } from './environment'
import { infoSdkLogger } from './sdk-logger'

xdescribe('Calculate sum', () => {
  let environment: Environment
  let profile: string
  let region: string
  let lambdaClient: LambdaClient
  let invokeInput: InvokeCommandInput

  beforeEach(async () => {
    environment = process.env['E2E_ENVIRONMENT'] as Environment
    profile = getProfile(environment)
    region = getRegion(environment)

    const ssmClient = new SSMClient({
      credentials: fromSSO({
        profile,
      }),
      region,
      logger: infoSdkLogger,
      maxAttempts: 3,
    })
    lambdaClient = new LambdaClient({
      credentials: fromSSO({
        profile,
      }),
      region,
      logger: infoSdkLogger,
      maxAttempts: 3,
    })

    const functionNameOutput = await ssmClient.send(
      new GetParameterCommand({
        Name: `/e2e/${environment}/Api/ExampleFunction`,
      })
    )

    invokeInput = {
      FunctionName: functionNameOutput?.Parameter?.Value,
      InvocationType: InvocationType.RequestResponse,
      LogType: LogType.None,
    }
  })

  describe('Given an event with the numbers 4 and 3,', () => {
    beforeEach(async () => {
      const event = await readFile(resolve(__dirname, '../events/sum/sum7.json'), { encoding: 'utf-8' })
      invokeInput.Payload = event
    })

    test('should return a response with the sum of 7.', async () => {
      const command = new InvokeCommand(invokeInput)

      const response = await lambdaClient.send(command)
      const payload = JSON.parse(Buffer.from(response.Payload ?? '').toString())

      expect(response.StatusCode).toBe(200)
      expect(response.FunctionError).toBeFalsy()
      expect(payload).toEqual({
        sum: 7,
      })
    })
  })

  describe('Given an event with the numbers 8 and 4,', () => {
    beforeEach(async () => {
      const event = await readFile(resolve(__dirname, '../events/sum/sum12.json'), { encoding: 'utf-8' })
      invokeInput.Payload = event
    })

    test('should return a response with the sum of 12.', async () => {
      const command = new InvokeCommand(invokeInput)

      const response = await lambdaClient.send(command)
      const payload = JSON.parse(Buffer.from(response.Payload ?? '').toString())

      expect(response.StatusCode).toBe(200)
      expect(response.FunctionError).toBeFalsy()
      expect(payload).toEqual({
        sum: 12,
      })
    })
  })
})
