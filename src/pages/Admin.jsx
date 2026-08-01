import { useEffect, useRef, useState } from 'react'
import { categories, products, formatRupiah } from '../data/products'
import { useUploads, resizeImageFile } from '../context/UploadsContext'
import { useStock } from '../context/StockContext'
import { getSheetsUrl, setSheetsUrl, getStockToken, setStockToken, fetchReport, saveModals } from '../utils/sheets'
import ProductImage from '../components/ProductImage'

const PERIOD_LABELS = {
  '7hari': '7 Hari Terakhir',
  '30hari': '30 Hari Terakhir',
  'bulanini': 'Bulan Ini',
  'semua': 'Semua Waktu',
}

export default function Admin() {
  const { uploads, setUpload, removeUpload } = useUploads()
  const { getStock, setStock, removeStock, refresh, syncing, isCentral, featured, updateFeatured, loaded } =
    useStock()
  const [tab, setTab] = useState('stok')
  const [busyId, setBusyId] = useState(null)
  const [stockInputs, setStockInputs] = useState({})
  const [sheetsUrl, setSheetsUrlState] = useState(getSheetsUrl())
  const [stockToken, setStockTokenState] = useState(getStockToken())
  const [sheetsSaved, setSheetsSaved] = useState(false)
  const [featDraft, setFeatDraft] = useState(null)
  const [featSaving, setFeatSaving] = useState(false)
  const [featSaved, setFeatSaved] = useState(false)
  const [report, setReport] = useState(null)
  const [modals, setModals] = useState({})
  const [period, setPeriod] = useState('7hari')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState('')
  const [modalDirty, setModalDirty] = useState(false)
  const [modalSaved, setModalSaved] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (tab === 'laporan') {
      loadReport()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const loadReport = async () => {
    setReportLoading(true)
    setReportError('')
    const res = await fetchReport()
    if (res.ok) {
      setReport(res.periods)
      setModals((prev) => ({ ...prev, ...res.modals }))
    } else {
      setReportError(
        res.reason === 'not-configured'
          ? 'Google Sheets belum dihubungkan di bagian atas halaman ini.'
          : 'Gagal memuat laporan: ' + res.reason,
      )
    }
    setReportLoading(false)
  }

  const saveModalBtn = async () => {
    const filtered = {}
    Object.keys(modals).forEach((id) => {
      const v = modals[id]
      if (v !== '' && v != null && Number(v) > 0) filtered[id] = Number(v)
    })
    const res = await saveModals(filtered)
    if (!res.ok) {
      alert('Gagal menyimpan modal: ' + res.reason)
      return
    }
    setModals((prev) => ({ ...prev, ...res.modals }))
    setModalDirty(false)
    setModalSaved(true)
    setTimeout(() => setModalSaved(false), 2000)
  }

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

  const featList = featDraft ?? featured

  const toggleFeat = (id) => {
    setFeatDraft((prev) => {
      const cur = prev ?? featured
      return cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    })
  }

  const moveFeat = (id, dir) => {
    setFeatDraft((prev) => {
      const cur = prev ?? featured
      const i = cur.indexOf(id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= cur.length) return cur
      const n = [...cur]
      ;[n[i], n[j]] = [n[j], n[i]]
      return n
    })
  }

  const saveFeat = async () => {
    if (featDraft === null) return
    setFeatSaving(true)
    const res = await updateFeatured(featDraft)
    if (!res.ok) {
      alert('Gagal menyimpan menu unggulan: ' + res.reason)
    } else {
      setFeatSaved(true)
      setTimeout(() => setFeatSaved(false), 2000)
    }
    setFeatSaving(false)
    setFeatDraft(null)
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
        <button
          className={`admin-tab${tab === 'unggulan' ? ' active' : ''}`}
          onClick={() => setTab('unggulan')}
        >
          Menu Unggulan
        </button>
        <button
          className={`admin-tab${tab === 'laporan' ? ' active' : ''}`}
          onClick={() => setTab('laporan')}
        >
          Laporan Keuntungan
        </button>
      </div>

      {tab === 'laporan' ? (
        <div>
          {reportError && <p className="hint warn">{reportError}</p>}
          {reportLoading && <p className="hint">Memuat laporan...</p>}

          {report && !reportError && (
            <>
              <div className="feat-actions">
                {Object.keys(PERIOD_LABELS).map((k) => (
                  <button
                    key={k}
                    className={`admin-tab${period === k ? ' active' : ''}`}
                    onClick={() => setPeriod(k)}
                  >
                    {PERIOD_LABELS[k]}
                  </button>
                ))}
                <button className="btn btn-outline" onClick={() => loadReport()}>
                  Muat Ulang
                </button>
              </div>

              <div className="report-cards">
                <div className="report-card">
                  <span>Pendapatan</span>
                  <strong>{formatRupiah(report[period].revenue)}</strong>
                </div>
                <div className="report-card">
                  <span>Modal</span>
                  <strong>{formatRupiah(report[period].cost)}</strong>
                </div>
                <div className="report-card good">
                  <span>Keuntungan</span>
                  <strong>{formatRupiah(report[period].profit)}</strong>
                </div>
                <div className="report-card">
                  <span>Pesanan</span>
                  <strong>{report[period].orders}</strong>
                </div>
                <div className="report-card">
                  <span>Item Terjual</span>
                  <strong>{report[period].qty}</strong>
                </div>
              </div>
              {report[period].qty === 0 && (
                <p className="hint">
                  Belum ada penjualan di periode ini. Keuntungan dihitung dari pesanan baru yang
                  tercatat (yang lama di "Pesanan" tidak ikut detail).
                </p>
              )}

              <section className="section">
                <h2 className="section-title">Rincian per Produk ({PERIOD_LABELS[period]})</h2>
                <div className="report-table">
                  <div className="report-row head">
                    <span>Produk</span>
                    <span>Terjual</span>
                    <span>Pendapatan</span>
                    <span>Modal</span>
                    <span>Untung</span>
                  </div>
                  {Object.values(report[period].per)
                    .sort((a, b) => b.revenue - a.revenue)
                    .map((r) => (
                      <div className="report-row" key={r.name}>
                        <span className="report-name">{r.name}</span>
                        <span>{r.qty}</span>
                        <span>{formatRupiah(r.revenue)}</span>
                        <span>{r.cost ? formatRupiah(r.cost) : '—'}</span>
                        <span className={r.profit >= 0 ? 'good' : 'bad'}>
                          {formatRupiah(r.profit)}
                        </span>
                      </div>
                    ))}
                </div>
              </section>
            </>
          )}

          <section className="section">
            <h2 className="section-title">Atur Modal / HPP per Produk</h2>
            <p className="hint">
              Isi harga modal tiap produk agar keuntungan akurat (keuntungan = harga jual − modal).
            </p>
            <div className="feat-actions">
              <button className="btn btn-primary" onClick={saveModalBtn} disabled={!modalDirty}>
                Simpan Modal
              </button>
              {modalSaved && <span className="hint ok">Tersimpan.</span>}
            </div>
            <div className="stock-list">
              {products.map((p) => (
                <div key={p.id} className="stock-row">
                  <div className="stock-info">
                    <p className="stock-name">{p.name}</p>
                    <p className="stock-status">{formatRupiah(p.price ?? 0)} jual</p>
                  </div>
                  <div className="stock-actions">
                    <input
                      type="number"
                      min="0"
                      placeholder="Modal / HPP"
                      value={modals[p.id] ?? ''}
                      onChange={(e) => {
                        setModals((prev) => ({ ...prev, [p.id]: e.target.value }))
                        setModalDirty(true)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : tab === 'unggulan' ? (
        <div>
          <p className="hint">
            {isCentral
              ? 'Centang produk yang tampil di "Menu Unggulan" beranda untuk semua pengunjung. Atur urutan dengan panah, lalu Simpan.'
              : 'Mode lokal: perubahan hanya tampil di perangkat ini. Hubungkan Google Sheets agar tampil untuk semua pengunjung.'}
          </p>
          {!loaded && <p className="hint">Memuat data...</p>}
          <div className="feat-actions">
            <button className="btn btn-primary" onClick={saveFeat} disabled={featDraft === null || featSaving}>
              {featSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            {featDraft !== null && (
              <button className="btn btn-outline" onClick={() => setFeatDraft(null)}>
                Batal
              </button>
            )}
            {featSaved && <span className="hint ok">Tersimpan.</span>}
          </div>
          <section className="section">
            <h2 className="section-title">Produk Unggulan (urutan tampil)</h2>
            <div className="stock-list">
              {featList.length === 0 && <p className="hint">Belum ada produk unggulan.</p>}
              {featList.map((id, idx) => {
                const p = products.find((x) => x.id === id)
                if (!p) return null
                return (
                  <div key={id} className="stock-row">
                    <div className="stock-info">
                      <p className="stock-name">{p.name}</p>
                      <p className="stock-status">Urutan {idx + 1}</p>
                    </div>
                    <div className="stock-actions">
                      <button className="btn btn-outline" onClick={() => moveFeat(id, -1)} disabled={idx === 0}>
                        ↑
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => moveFeat(id, 1)}
                        disabled={idx === featList.length - 1}
                      >
                        ↓
                      </button>
                      <button className="btn btn-outline" onClick={() => toggleFeat(id)}>
                        Hapus
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
          <section className="section">
            <h2 className="section-title">Produk Lainnya</h2>
            <div className="stock-list">
              {products
                .filter((p) => !featList.includes(p.id))
                .map((p) => (
                  <div key={p.id} className="stock-row">
                    <div className="stock-info">
                      <p className="stock-name">{p.name}</p>
                      <p className="stock-status">
                        {categories.find((c) => c.slug === p.category)?.name}
                      </p>
                    </div>
                    <div className="stock-actions">
                      <button className="btn btn-primary" onClick={() => toggleFeat(p.id)}>
                        Tambah
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>
      ) : tab === 'stok' ? (
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
        <div>
          <p className="hint">
            Upload di sini hanya tersimpan di perangkat ini. Foto permanen: taruh foto di folder
            new-images di komputer, lalu jalankan update-images dan deploy.
          </p>
          {categories.map((cat) => {
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
        })}
        </div>
      )}
    </div>
  )
}
