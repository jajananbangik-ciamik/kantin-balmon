import { Link } from 'react-router-dom'
import { useStock } from '../context/StockContext'
import { useCatalog } from '../context/CatalogContext'
import ProductCard from '../components/ProductCard'

const DEFAULT_FEATURED = [
  'sosis-solo',
  'dimsum-orange',
  'dimsum-mozarella',
  'wonton',
  'pizza',
  'pancake-buah',
  'es-serut-durian',
  'durian-monthong',
  'rendang',
  'ayam-bakar',
  'nila-bakar',
  'ikan-marinasi',
]

export default function Home() {
  const { featured } = useStock()
  const { categories, products } = useCatalog()
  const ids = featured && featured.length ? featured : DEFAULT_FEATURED
  const featuredList = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean)

  return (
    <>
      <section className="hero">
        <h1>KANTIN BALMON</h1>
        <p className="hero-tag">Pertolongan Pertama Pada Kelaparan</p>
        <p className="hero-sub">
          Self-service — ambil sendiri jajanan favoritmu yang tersedia di rak Kantin Balmon.
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">Menu Unggulan</h2>
        <div className="product-grid">
          {featuredList.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Kategori</h2>
        <div className="category-grid">
          {categories.map((c) => (
            <Link key={c.slug} to={`/kategori/${c.slug}`} className="category-card">
              <span className="category-name">{c.name}</span>
              <span className="category-tagline">{c.tagline}</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
