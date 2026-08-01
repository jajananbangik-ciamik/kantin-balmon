import { useParams } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'
import ProductCard from '../components/ProductCard'

export default function CategoryPage() {
  const { slug } = useParams()
  const { getCategory, getProductsByCategory } = useCatalog()
  const category = getCategory(slug)
  const items = getProductsByCategory(slug)

  return (
    <div className="page">
      <div className="page-head">
        <h1>{category?.name ?? 'Kategori'}</h1>
        {category?.tagline && <p>{category.tagline}</p>}
      </div>
      {items.length ? (
        <div className="product-grid">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="empty">Belum ada produk di kategori ini.</p>
      )}
    </div>
  )
}
