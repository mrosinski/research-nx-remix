import { ProductsList } from '@research-nx-remix/libs/products-list'

export default function Index() {
  return (
    <div style={{ backgroundColor: 'darkolivegreen', padding: '20px' }}>
      <h1>@/apps/webshop</h1>
      <ProductsList />
    </div>
  )
}
