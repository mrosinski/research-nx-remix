import { render } from '@testing-library/react'

import ProductsList from './products-list'

describe('ProductsList', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ProductsList />)
    expect(baseElement).toBeTruthy()
  })
})
