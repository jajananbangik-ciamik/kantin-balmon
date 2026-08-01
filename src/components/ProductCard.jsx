import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { formatRupiah } from '../data/products'
import ProductImage from './ProductImage'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const [variant, setVariant] = useState(product.variants ? product.variants[0].label : null)
  const [added, setAdded] = useState(false)

  const currentPrice = product.variants
    ? product.variants.find((v) => v.label === variant)?.price
    : product.price

  const handleAdd = () => {
    addItem(product, variant)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <article className="product-card">
      <div className="product-img">
        <ProductImage product={product} alt={product.name} />
      </div>
      <div className="product-body">
        <h3 className="product-name">{product.name}</h3>
        {product.priceNote && <p className="product-note">{product.priceNote}</p>}
        <div className="product-price">
          {currentPrice != null ? (
            formatRupiah(currentPrice)
          ) : (
            <span className="price-na">Harga on request</span>
          )}
        </div>
        {product.variants && (
          <div className="variant-row">
            {product.variants.map((v) => (
              <button
                key={v.label}
                className={`variant-pill${v.label === variant ? ' active' : ''}`}
                onClick={() => setVariant(v.label)}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
        {product.externalUrl ? (
          <a className="btn btn-outline" href={product.externalUrl} target="_blank" rel="noreferrer">
            Lihat Detail
          </a>
        ) : (
          <button className={`btn btn-primary${added ? ' added' : ''}`} onClick={handleAdd}>
            {added ? '✓ Ditambahkan' : '+ Tambah'}
          </button>
        )}
      </div>
    </article>
  )
}
