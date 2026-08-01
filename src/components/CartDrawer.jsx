import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { getProduct, formatRupiah } from '../data/products'

export default function CartDrawer({ open, onClose }) {
  const { items, increment, decrement, removeItem, linePrice, itemCount, subtotal } = useCart()
  const navigate = useNavigate()

  if (!open) return null

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2>Keranjang ({itemCount})</h2>
          <button className="drawer-close" onClick={onClose} aria-label="Tutup keranjang">
            ×
          </button>
        </div>
        <div className="drawer-items">
          {items.length === 0 && <p className="empty">Keranjang masih kosong.</p>}
          {items.map((item) => {
            const product = getProduct(item.productId)
            const price = linePrice(item)
            return (
              <div key={`${item.productId}::${item.variantLabel || ''}`} className="drawer-item">
                <div className="drawer-item-info">
                  <p className="drawer-item-name">{product?.name}</p>
                  {item.variantLabel && <p className="drawer-item-variant">{item.variantLabel}</p>}
                  <p className="drawer-item-price">
                    {price != null ? formatRupiah(price) : 'Harga on request'}
                  </p>
                </div>
                <div className="qty">
                  <button onClick={() => decrement(item.productId, item.variantLabel)}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => increment(item.productId, item.variantLabel)}>+</button>
                </div>
                <button
                  className="drawer-item-remove"
                  onClick={() => removeItem(item.productId, item.variantLabel)}
                  aria-label="Hapus item"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
        <div className="drawer-foot">
          <div className="drawer-total">
            <span>Subtotal</span>
            <strong>{formatRupiah(subtotal)}</strong>
          </div>
          <button
            className="btn btn-primary btn-block"
            disabled={items.length === 0}
            onClick={() => {
              onClose()
              navigate('/checkout')
            }}
          >
            Buat Daftar Belanja
          </button>
        </div>
      </aside>
    </div>
  )
}
