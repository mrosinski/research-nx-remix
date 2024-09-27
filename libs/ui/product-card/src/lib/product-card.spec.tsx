import { render } from '@testing-library/react'

import ProductCard from './product-card'

describe('ProductCard', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ProductCard product={{ name: 'name', id: '1', description: 'description' }} />)
    expect(baseElement).toBeTruthy()
  })
})
