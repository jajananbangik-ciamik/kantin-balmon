import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useStock } from '../context/StockContext'
import { useCatalog } from '../context/CatalogContext'
import { formatRupiah } from '../data/products'
import { sendOrderToSheets } from '../utils/sheets'

const ORDERS_KEY = 'kantin-balmon-orders'

const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []
  } catch {
    return []
  }
}

export default function Checkout() {
  const { items, linePrice, subtotal, clearCart } = useCart()
  const { decrementStock, refresh } = useStock()
  const { getProduct } = useCatalog()
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [order, setOrder] = useState(null)
  const [history, setHistory] = useState(loadHistory)
  const [sendStatus, setSendStatus] = useState('idle')

  const hasUnpriced = items.some((i) => linePrice(i) == null)

  const buildOrder = async () => {
    const id = `KB-${Date.now().toString().slice(-6)}`
    const o = {
      id,
      name: name.trim(),
      notes: notes.trim(),
      items: items.map((i) => ({
        productId: i.productId,
        name: getProduct(i.productId)?.name ?? i.productId,
        variant: i.variantLabel || '',
        qty: i.qty,
        price: linePrice(i),
      })),
      subtotal,
      createdAt: new Date().toISOString(),
    }
    const next = [o, ...history]
    localStorage.setItem(ORDERS_KEY, JSON.stringify(next))
    setHistory(next)
    setOrder(o)
    items.forEach((i) => decrementStock(i.productId, i.qty))
    clearCart()

    setSendStatus('sending')
    const res = await sendOrderToSheets(o)
    if (res.ok) await refresh()
    setSendStatus(res.ok ? 'sent' : res.reason === 'not-configured' ? 'not-configured' : 'failed')
  }

  const printOrder = () => window.print()

  return (
    <div className="page">
      <h1 className="page-head-title">Daftar Belanja</h1>

      {!order ? (
        items.length === 0 ? (
          <p className="empty">
            Keranjang masih kosong. <Link to="/">Mulai belanja</Link> dulu.
          </p>
        ) : (
          <>
            <section className="checkout-form">
              <label>
                Nama Pembeli <small>(opsional)</small>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama kamu"
                />
              </label>
              <label>
                Catatan <small>(opsional)</small>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan untuk daftar belanja..."
                  rows="3"
                />
              </label>
            </section>

            <section className="order-list">
              <h2>Rincian Belanja</h2>
              {items.map((item) => {
                const product = getProduct(item.productId)
                const price = linePrice(item)
                return (
                  <div key={`${item.productId}::${item.variantLabel || ''}`} className="order-row">
                    <div>
                      <p className="order-name">{product?.name}</p>
                      {item.variantLabel && <p className="order-variant">{item.variantLabel}</p>}
                      <p className="order-unit">
                        {price != null ? formatRupiah(price) : 'Harga on request'} × {item.qty}
                      </p>
                    </div>
                    <strong>{price != null ? formatRupiah(price * item.qty) : '—'}</strong>
                  </div>
                )
              })}
              <div className="order-total">
                <span>Total</span>
                <strong>{hasUnpriced ? `${formatRupiah(subtotal)} *` : formatRupiah(subtotal)}</strong>
              </div>
              {hasUnpriced && (
                <p className="hint">* Sebagian produk harganya ditanyakan langsung ke kasir.</p>
              )}
            </section>

            <button className="btn btn-primary btn-block" onClick={buildOrder}>
              Simpan Daftar Belanja
            </button>
          </>
        )
      ) : (
        <section className="order-result print-area">
          <p className="order-id">No. Daftar: {order.id}</p>
          {order.name && (
            <p>
              Pembeli: <strong>{order.name}</strong>
            </p>
          )}
          {order.notes && <p>Catatan: {order.notes}</p>}
          <p className="order-date">{new Date(order.createdAt).toLocaleString('id-ID')}</p>

          <div className="order-list">
            {order.items.map((item) => {
              const product = getProduct(item.productId)
              const price = item.price != null ? item.price : linePrice(item)
              return (
                <div key={`${item.productId}::${item.variant || ''}`} className="order-row">
                  <div>
                    <p className="order-name">{product?.name ?? item.name}</p>
                    {item.variant && <p className="order-variant">{item.variant}</p>}
                    <p className="order-unit">
                      {price != null ? formatRupiah(price) : 'Harga on request'} × {item.qty}
                    </p>
                  </div>
                  <strong>{price != null ? formatRupiah(price * item.qty) : '—'}</strong>
                </div>
              )
            })}
            <div className="order-total">
              <span>Total</span>
              <strong>{formatRupiah(order.subtotal)}</strong>
            </div>
          </div>

          <div className="result-actions no-print">
            <button className="btn btn-primary" onClick={printOrder}>
              Cetak / Simpan PDF
            </button>
            <button className="btn btn-outline" onClick={() => setOrder(null)}>
              Buat Baru
            </button>
          </div>
          <p className="hint no-print">
            Ambil sendiri item di rak Kantin Balmon, lalu tunjukkan daftar ini ke kasir.
          </p>
          <p
            className={`hint no-print send-status ${
              sendStatus === 'sent' ? 'ok' : sendStatus === 'failed' || sendStatus === 'not-configured' ? 'warn' : ''
            }`}
          >
            {sendStatus === 'sending' && 'Mengirim ke Google Sheets...'}
            {sendStatus === 'sent' && '✓ Daftar terkirim ke Google Sheets.'}
            {sendStatus === 'not-configured' &&
              'Google Sheets belum dihubungkan (atur URL di halaman /admin).'}
            {sendStatus === 'failed' &&
              'Gagal mengirim ke Google Sheets. Daftar tetap tersimpan di perangkat ini.'}
          </p>
        </section>
      )}

      {history.length > 0 && (
        <section className="section">
          <h2 className="section-title">Riwayat Daftar Belanja</h2>
          {history.map((o) => (
            <details key={o.id} className="history-item">
              <summary>
                {o.id} — {new Date(o.createdAt).toLocaleString('id-ID')}
                {o.name ? ` — ${o.name}` : ''}
              </summary>
              <div className="order-list">
                {o.items.map((item) => {
                  const product = getProduct(item.productId)
                  return (
                    <div key={`${item.productId}::${item.variantLabel || ''}`} className="order-row">
                      <p className="order-name">
                        {product?.name}
                        {item.variantLabel ? ` (${item.variantLabel})` : ''} × {item.qty}
                      </p>
                    </div>
                  )
                })}
                <div className="order-total">
                  <span>Total</span>
                  <strong>{formatRupiah(o.subtotal)}</strong>
                </div>
              </div>
            </details>
          ))}
        </section>
      )}
    </div>
  )
}
