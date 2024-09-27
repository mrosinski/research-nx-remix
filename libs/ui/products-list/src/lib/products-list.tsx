import { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { Product, ProductCard } from '@research-nx-remix/ui-product-card'

const createProduct = (): Product => ({
  id: faker.string.uuid(),
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
})

const products: Product[] = faker.helpers.multiple(createProduct, { count: 3 })

export function ProductsList(): ReactNode {
  return (
    <div
      style={{ backgroundColor: 'darkcyan', display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}
    >
      <h2>@/libs/products-list</h2>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default ProductsList
