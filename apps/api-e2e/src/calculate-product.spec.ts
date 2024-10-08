import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'
import { fromSSO } from '@aws-sdk/credential-providers'
import { URLSearchParams } from 'node:url'
import { Environment, getProfile, getRegion } from './environment'
import { infoSdkLogger } from './sdk-logger'

xdescribe('Calculate product', () => {
  let environment: Environment
  let profile: string
  let region: string
  let apiUrl: string

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

    apiUrl =
      (
        await ssmClient.send(
          new GetParameterCommand({
            Name: `/e2e/${environment}/Api/ExampleApiConstruct/url`,
          })
        )
      ).Parameter?.Value ?? ''
  })

  describe('Given the numbers 4 and 3,', () => {
    const a = 4
    const b = 3

    test('should return a response with the product of 12.', async () => {
      const response = await fetch(
        `${apiUrl}/product?${new URLSearchParams({
          a: a.toString(),
          b: b.toString(),
        })}`
      )

      if (!response.ok) {
        throw new Error(`Invalid response '${await response.text()}'.`)
      }

      const payload = await response.json()

      expect(response.status).toBe(200)
      expect(payload).toEqual({
        product: 12,
      })
    })
  })

  describe('Given the numbers 8 and 4,', () => {
    const a = 8
    const b = 4

    test('should return a response with the product of 32.', async () => {
      const response = await fetch(
        `${apiUrl}/product?${new URLSearchParams({
          a: a.toString(),
          b: b.toString(),
        })}`
      )

      if (!response.ok) {
        throw new Error(`Invalid response '${await response.text()}'.`)
      }

      const payload = await response.json()

      expect(response.status).toBe(200)
      expect(payload).toEqual({
        product: 32,
      })
    })
  })
})
