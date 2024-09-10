import { ReactNode } from 'react'
import { Product } from './product.model'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps): ReactNode {
  return (
    <div style={{ backgroundColor: 'darkgoldenrod', padding: '20px' }}>
      <h3>@/libs/product-card</h3>
      <h4>{product.name}</h4>
      <p>{product.description}</p>
    </div>
  )
}

export default ProductCard
