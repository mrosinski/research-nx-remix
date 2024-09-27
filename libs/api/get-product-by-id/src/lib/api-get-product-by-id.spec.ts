import { apiGetProductById } from './api-get-product-by-id'

describe('apiGetProductById', () => {
  it('should work', () => {
    expect(apiGetProductById()).toEqual('api-get-product-by-id')
  })
})
