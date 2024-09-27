import { ProductsList } from '@research-nx-remix/ui-products-list'

export default function Index() {
  return (
    <div style={{ backgroundColor: 'cornflowerblue', padding: '20px' }}>
      <h1>@/apps/homepage</h1>
      <ProductsList />
    </div>
  )
}
