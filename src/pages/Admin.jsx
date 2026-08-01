import { useRef, useState } from 'react'
import { categories, products } from '../data/products'
import { useUploads, resizeImageFile } from '../context/UploadsContext'
import { useStock } from '../context/StockContext'
import { getSheetsUrl, setSheetsUrl, getStockToken, setStockToken } from '../utils/sheets'
import ProductImage from '../components/ProductImage'

export default function Admin() {
  const { uploads, setUpload, removeUpload } = useUploads()
  const { getStock, setStock, removeStock, refresh, syncing, isCentral } = useStock()
  const [tab, setTab] = useState('stok')
  const [busyId, setBusyId] = useState(null)
  const [stockInputs, setStockInputs] = useState({})
  const [sheetsUrl, setSheetsUrlState] = useState(getSheetsUrl())
  const [stockToken, setStockTokenState] = useState(getStockToken())
  const [sheetsSaved, setSheetsSaved] = useState(false)
  const fileRef = useRef(null)

  const onPick = async (product, file) => {
    if (!file) return
    setBusyId(product.id)
    try {
      const dataUrl = await resizeImageFile(file)
      setUpload(product.id, dataUrl)
    } catch (err) {
      alert('Gagal memproses gambar: ' + err.message)
    } finally {
      setBusyId(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleStockInput = (product, value) => {
    setStockInputs((prev) => ({ ...prev, [product.id]: value }))
  }

  const applyStock = async (product, n) => {
    if (n == null || Number.isNaN(n)) return
    setStockInputs((prev) => ({ ...prev, [product.id]: '' }))
    const res = await setStock(product.id, n)
    if (res && !res.ok) alert('Gagal menyimpan stok: ' + res.reason)
  }

  const adjustStock = async (product, delta) => {
    const current = getStock(product.id)
    if (current === null) return applyStock(product, Math.max(0, delta))
    await applyStock(product, current + delta)
  }

  const saveSheets = () => {
    setSheetsUrl(sheetsUrl.trim())
    setStockToken(stockToken.trim())
    setSheetsSaved(true)
    setTimeout(() => setSheetsSaved(false), 2000)
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-head-title">Manajemen Toko</h1>
        <p>Kelola stok (terpusat), upload foto, dan rekap pesanan via Google Sheets.</p>
      </div>

      <section className="section sheets-section">
        <h2 className="section-title">Google Sheets (Pesanan + Stok Terpusat)</h2>
        <p className="hint">
          Tempel Web App URL dari Google Apps Script. Stok jadi terpusat & pesanan otomatis
          masuk ke spreadsheet. Petunjuk di file <code>google-sheet-appscript.gs</code>.
        </p>
        <div className="sheets-row">
          <input
            type="text"
            value={sheetsUrl}
            onChange={(e) => setSheetsUrlState(e.target.value)}
            placeholder="https://script.google.com/macros/s/xxxx/exec"
          />
          <button className="btn btn-primary" onClick={saveSheets}>
            Simpan
          </button>
        </div>
        <div className="sheets-row">
          <input
            type="text"
            value={stockToken}
            onChange={(e) => setStockTokenState(e.target.value)}
            placeholder="Token stok (opsional, samakan dengan TOKEN di Apps Script)"
          />
        </div>
        {sheetsSaved && <p className="hint ok">Pengaturan tersimpan.</p>}
        <p className="hint">
          Mode saat ini:{' '}
          <strong>{isCentral ? 'Stok terpusat (Google Sheets)' : 'Stok lokal (per perangkat)'}</strong>
        </p>
      </section>

      <div className="admin-tabs">
        <button
          className={`admin-tab${tab === 'stok' ? ' active' : ''}`}
          onClick={() => setTab('stok')}
        >
          Stok Produk
        </button>
        <button
          className={`admin-tab${tab === 'foto' ? ' active' : ''}`}
          onClick={() => setTab('foto')}
        >
          Upload Foto
        </button>
      </div>

      {tab === 'stok' ? (
        <>
          <button className="btn btn-outline" onClick={() => refresh()} disabled={syncing}>
            {syncing ? 'Memuat ulang...' : 'Muat Ulang Stok'}
          </button>
          {categories.map((cat) => {
            const items = products.filter((p) => p.category === cat.slug)
            if (!items.length) return null
            return (
              <section key={cat.slug} className="section">
                <h2 className="section-title">{cat.name}</h2>
                <div className="stock-list">
                  {items.map((product) => {
                    const stock = getStock(product.id)
                    const tracked = stock !== null
                    return (
                      <div key={product.id} className="stock-row">
                        <div className="stock-info">
                          <p className="stock-name">{product.name}</p>
                          <p className={`stock-status${tracked && stock <= 0 ? ' out' : ''}`}>
                            {!tracked
                              ? 'Stok tidak dibatasi'
                              : stock <= 0
                                ? 'Stok habis'
                                : `Sisa ${stock}`}
                          </p>
                        </div>
                        <div className="stock-actions">
                          <input
                            type="number"
                            min="0"
                            placeholder="Jumlah"
                            value={stockInputs[product.id] ?? ''}
                            onChange={(e) => handleStockInput(product, e.target.value)}
                          />
                          <button
                            className="btn btn-primary"
                            onClick={() => applyStock(product, Number(stockInputs[product.id]))}
                          >
                            Set
                          </button>
                          <button className="btn btn-outline" onClick={() => adjustStock(product, 5)}>
                            +5
                          </button>
                          <button className="btn btn-outline" onClick={() => adjustStock(product, -5)}>
                            -5
                          </button>
                          <button className="btn btn-outline" onClick={() => applyStock(product, 0)}>
                            Habis
                          </button>
                          <button className="btn btn-outline" onClick={() => removeStock(product.id)}>
                            Tanpa Stok
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </>
      ) : (
        categories.map((cat) => {
          const items = products.filter((p) => p.category === cat.slug)
          if (!items.length) return null
          return (
            <section key={cat.slug} className="section">
              <h2 className="section-title">{cat.name}</h2>
              <div className="admin-grid">
                {items.map((product) => (
                  <div key={product.id} className="admin-card">
                    <div className="admin-thumb">
                      <ProductImage product={product} alt={product.name} />
                    </div>
                    <p className="admin-name">{product.name}</p>
                    <label className="btn btn-outline btn-block">
                      {busyId === product.id ? 'Memproses...' : 'Pilih Foto'}
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        hidden
                        disabled={busyId === product.id}
                        onChange={(e) => onPick(product, e.target.files?.[0])}
                      />
                    </label>
                    {uploads[product.id] && (
                      <button
                        className="btn btn-block"
                        style={{ background: '#fff1f2', color: '#e03131', border: '1px solid #ffc9c9' }}
                        onClick={() => removeUpload(product.id)}
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
