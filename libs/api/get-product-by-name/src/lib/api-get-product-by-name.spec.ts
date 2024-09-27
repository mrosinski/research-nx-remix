import { apiGetProductByName } from './api-get-product-by-name'

describe('apiGetProductByName', () => {
  it('should work', () => {
    expect(apiGetProductByName()).toEqual('api-get-product-by-name')
  })
})
