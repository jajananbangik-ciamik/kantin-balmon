import { useEffect, useRef, useState } from 'react'
import { products as baseProducts, categories as baseCategories, formatRupiah } from '../data/products'
import { useUploads, resizeImageFile } from '../context/UploadsContext'
import { useStock } from '../context/StockContext'
import { useCatalog } from '../context/CatalogContext'
import { getSheetsUrl, setSheetsUrl, getStockToken, setStockToken, fetchReport, saveModals, verifyAdmin } from '../utils/sheets'
import ProductImage from '../components/ProductImage'

const PERIOD_LABELS = {
  '7hari': '7 Hari Terakhir',
  '30hari': '30 Hari Terakhir',
  'bulanini': 'Bulan Ini',
  'semua': 'Semua Waktu',
}

const ADMIN_OK_KEY = 'kantin-balmon-admin-ok'

const checkAuthed = () => {
  try {
    return sessionStorage.getItem(ADMIN_OK_KEY) === '1'
  } catch {
    return false
  }
}

export default function Admin() {
  const { uploads, setUpload, removeUpload } = useUploads()
  const { getStock, setStock, removeStock, refresh, syncing, isCentral, featured, updateFeatured, loaded } =
    useStock()
  const {
    products,
    categories,
    catEdits,
    saveCatalog,
    saveCategories,
    loaded: catLoaded,
    syncing: catSyncing,
  } = useCatalog()
  const [authed, setAuthed] = useState(checkAuthed)
  const [passInput, setPassInput] = useState('')
  const [passError, setPassError] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [tab, setTab] = useState('stok')
  const [busyId, setBusyId] = useState(null)
  const [stockInputs, setStockInputs] = useState({})
  const [stockSaving, setStockSaving] = useState(false)
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
  const [modalSaving, setModalSaving] = useState(false)
  const [menuDraft, setMenuDraft] = useState(null)
  const [menuLoaded, setMenuLoaded] = useState(false)
  const [menuSearch, setMenuSearch] = useState('')
  const [menuSaving, setMenuSaving] = useState(false)
  const [menuSaved, setMenuSaved] = useState(false)
  const [menuDirty, setMenuDirty] = useState(false)
  const [catDraft, setCatDraft] = useState(null)
  const [catUiLoaded, setCatUiLoaded] = useState(false)
  const [catUiSaving, setCatUiSaving] = useState(false)
  const [catUiSaved, setCatUiSaved] = useState(false)
  const [catDirty, setCatDirty] = useState(false)
  const [catAutoWarning, setCatAutoWarning] = useState('')
  const fileRef = useRef(null)
  const stockTimerRef = useRef(null)
  const menuTimerRef = useRef(null)
  const catTimerRef = useRef(null)
  const featTimerRef = useRef(null)
  const modalTimerRef = useRef(null)

  useEffect(() => {
    if (tab === 'menu' && !catUiLoaded) {
      const seen = new Set()
      const rows = []
      categories.forEach((c) => {
        rows.push({ slug: c.slug, name: c.name, active: true })
        seen.add(c.slug)
      })
      catEdits
        .filter((c) => c.active === false)
        .forEach((c) => {
          if (seen.has(c.slug)) return
          rows.push({ slug: c.slug, name: c.name, active: false })
          seen.add(c.slug)
        })
      baseCategories.forEach((c) => {
        if (seen.has(c.slug)) return
        rows.push({ slug: c.slug, name: c.name, active: false })
        seen.add(c.slug)
      })
      setCatDraft(rows)
      setCatUiLoaded(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, catLoaded, categories, catEdits])

  useEffect(() => {
    if (tab === 'menu' && !menuLoaded && products.length) {
      const visible = products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price ?? null,
        priceNote: p.priceNote || '',
        active: true,
      }))
      const hidden = baseProducts
        .filter((b) => !products.some((p) => p.id === b.id))
        .map((b) => ({
          id: b.id,
          name: b.name,
          category: b.category,
          price: b.price ?? null,
          priceNote: b.priceNote || '',
          active: false,
        }))
      setMenuDraft([...visible, ...hidden])
      setMenuLoaded(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, menuLoaded, products])

  useEffect(() => {
    if (tab === 'laporan') {
      loadReport()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  useEffect(() => {
    if (stockTimerRef.current) clearTimeout(stockTimerRef.current)
    const valid = Object.entries(stockInputs).filter(
      ([, v]) => v !== '' && v != null && !Number.isNaN(Number(v)),
    )
    if (!valid.length) return
    setStockSaving(true)
    stockTimerRef.current = setTimeout(async () => {
      for (const [id, v] of valid) {
        const res = await setStock(id, Number(v))
        if (res && !res.ok) alert('Gagal menyimpan stok: ' + res.reason)
      }
      setStockSaving(false)
    }, 800)
    return () => clearTimeout(stockTimerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockInputs])

  useEffect(() => {
    if (!menuDirty || !menuDraft) return
    if (menuTimerRef.current) clearTimeout(menuTimerRef.current)
    setMenuSaving(true)
    menuTimerRef.current = setTimeout(async () => {
      const res = await saveCatalog(menuDraft)
      if (!res.ok) {
        alert('Gagal menyimpan menu: ' + res.reason)
        setMenuSaving(false)
        return
      }
      setMenuSaved(true)
      setMenuDirty(false)
      setMenuSaving(false)
      setTimeout(() => setMenuSaved(false), 2000)
    }, 900)
    return () => clearTimeout(menuTimerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuDirty, menuDraft])

  useEffect(() => {
    if (!catDirty || !catDraft) return
    if (catTimerRef.current) clearTimeout(catTimerRef.current)
    setCatUiSaving(true)
    catTimerRef.current = setTimeout(async () => {
      const slugs = catDraft.map((c) => String(c.slug || '').trim()).filter(Boolean)
      const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i)
      if (dupes.length || catDraft.some((c) => !String(c.slug || '').trim())) {
        setCatAutoWarning('Slug kategori tidak boleh kosong atau duplikat. Perbaiki agar tersimpan.')
        setCatUiSaving(false)
        return
      }
      setCatAutoWarning('')
      const res = await saveCategories(catDraft)
      if (!res.ok) {
        alert('Gagal menyimpan kategori: ' + res.reason)
        setCatUiSaving(false)
        return
      }
      setCatUiSaved(true)
      setCatDirty(false)
      setCatUiSaving(false)
      setTimeout(() => setCatUiSaved(false), 2000)
    }, 1200)
    return () => clearTimeout(catTimerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catDirty, catDraft])

  useEffect(() => {
    if (featDraft === null) return
    if (featTimerRef.current) clearTimeout(featTimerRef.current)
    setFeatSaving(true)
    featTimerRef.current = setTimeout(async () => {
      const res = await updateFeatured(featDraft)
      if (!res.ok) {
        alert('Gagal menyimpan menu unggulan: ' + res.reason)
        setFeatSaving(false)
        return
      }
      setFeatSaved(true)
      setFeatDraft(null)
      setFeatSaving(false)
      setTimeout(() => setFeatSaved(false), 2000)
    }, 700)
    return () => clearTimeout(featTimerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featDraft])

  useEffect(() => {
    if (!modalDirty) return
    if (modalTimerRef.current) clearTimeout(modalTimerRef.current)
    setModalSaving(true)
    modalTimerRef.current = setTimeout(async () => {
      const filtered = {}
      Object.keys(modals).forEach((id) => {
        const v = modals[id]
        if (v !== '' && v != null && Number(v) > 0) filtered[id] = Number(v)
      })
      const res = await saveModals(filtered)
      if (!res.ok) {
        alert('Gagal menyimpan modal: ' + res.reason)
        setModalDirty(false)
        setModalSaving(false)
        return
      }
      setModals((prev) => ({ ...prev, ...res.modals }))
      setModalDirty(false)
      setModalSaved(true)
      setModalSaving(false)
      setTimeout(() => setModalSaved(false), 2000)
    }, 800)
    return () => clearTimeout(modalTimerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalDirty, modals])

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

  const updateMenuRow = (id, field, value) => {
    setMenuDirty(true)
    setMenuDraft((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    )
  }

  const removeMenuRow = (id) => {
    setMenuDirty(true)
    setMenuDraft((prev) => prev.filter((r) => r.id !== id))
  }

  const addMenuRow = () => {
    setMenuDirty(true)
    setMenuDraft((prev) => [
      ...prev,
      {
        id: 'produk-' + Date.now().toString().slice(-6),
        name: 'Produk Baru',
        category: categories[0]?.slug || '',
        price: null,
        priceNote: '',
        active: true,
      },
    ])
  }

  const updateCatRow = (slug, field, value) => {
    setCatDirty(true)
    setCatDraft((prev) => prev.map((r) => (r.slug === slug ? { ...r, [field]: value } : r)))
  }

  const moveCat = (index, dir) => {
    setCatDirty(true)
    setCatDraft((prev) => {
      const next = prev.slice()
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      const tmp = next[index]
      next[index] = next[target]
      next[target] = tmp
      return next
    })
  }

  const removeCat = (slug) => {
    setCatDirty(true)
    setCatDraft((prev) => prev.filter((r) => r.slug !== slug))
  }

  const addCat = () => {
    setCatDirty(true)
    setCatDraft((prev) => [
      ...prev,
      { slug: 'kategori-' + Date.now().toString().slice(-6), name: 'Kategori Baru', active: true },
    ])
  }

  const login = async (e) => {
    e.preventDefault()
    setPassError(false)
    setLoggingIn(true)
    const res = await verifyAdmin(passInput.trim())
    setLoggingIn(false)
    if (res.ok) {
      try {
        sessionStorage.setItem(ADMIN_OK_KEY, '1')
      } catch {
        /* ignore */
      }
      setAuthed(true)
    } else {
      setPassError(true)
    }
  }

  if (!authed) {
    return (
      <div className="page">
        <div className="admin-login">
          <h1 className="page-head-title">Kantin Balmon</h1>
          <p className="hint">Masukkan password untuk mengelola toko.</p>
          <form className="sheets-row" onSubmit={login}>
            <input
              type="password"
              value={passInput}
              onChange={(e) => setPassInput(e.target.value)}
              placeholder="Password admin"
              autoFocus
            />
            <button className="btn btn-primary" type="submit" disabled={loggingIn}>
              {loggingIn ? 'Memeriksa...' : 'Masuk'}
            </button>
          </form>
          {passError && <p className="hint err">Password salah.</p>}
        </div>
      </div>
    )
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
        <button
          className={`admin-tab${tab === 'menu' ? ' active' : ''}`}
          onClick={() => setTab('menu')}
        >
          Menu Jajanan
        </button>
      </div>

      {tab === 'menu' ? (
        <div>
          <div className="menu-cats">
            <h3 className="menu-subtitle">Kelola Kategori</h3>
            <p className="hint">
              Tambah, ubah nama, urutkan, atau sembunyikan kategori. Produk yang memakai kategori
              tersebut ikut berpindah otomatis. Perubahan tersimpan otomatis.
            </p>
            {!catUiLoaded && <p className="hint">Memuat data...</p>}
            <div className="feat-actions">
              <button className="btn btn-outline" onClick={addCat}>
                + Tambah Kategori
              </button>
              {catAutoWarning && <span className="hint warn">{catAutoWarning}</span>}
              {catUiSaving && <span className="hint">Menyimpan...</span>}
              {catUiSaved && <span className="hint ok">Tersimpan.</span>}
            </div>
            {!catDraft ? (
              <p className="hint">Menyiapkan kategori...</p>
            ) : (
              <div className="stock-list">
                {catDraft.map((c, i) => (
                  <div key={c.slug} className={`stock-row cat-row${c.active ? '' : ' off'}`}>
                    <div className="stock-info menu-info">
                      <input
                        className="menu-input"
                        value={c.name}
                        onChange={(e) => updateCatRow(c.slug, 'name', e.target.value)}
                      />
                      {baseCategories.some((b) => b.slug === c.slug) ? (
                        <input
                          className="menu-input small slug"
                          value={c.slug}
                          readOnly
                          title="Slug kategori bawaan tidak bisa diubah"
                        />
                      ) : (
                        <input
                          className="menu-input small slug"
                          value={c.slug}
                          placeholder="Slug (url, contoh: camilan-baru)"
                          onChange={(e) => updateCatRow(c.slug, 'slug', e.target.value)}
                        />
                      )}
                    </div>
                    <div className="stock-actions">
                      <button
                        className="btn btn-outline"
                        onClick={() => moveCat(i, -1)}
                        disabled={i === 0}
                        aria-label="Naik"
                      >
                        ↑
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => moveCat(i, 1)}
                        disabled={i === catDraft.length - 1}
                        aria-label="Turun"
                      >
                        ↓
                      </button>
                      <label className="menu-toggle">
                        <input
                          type="checkbox"
                          checked={c.active}
                          onChange={(e) => updateCatRow(c.slug, 'active', e.target.checked)}
                        />
                        Tampil
                      </label>
                      <button className="btn btn-outline" onClick={() => removeCat(c.slug)}>
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <hr className="menu-divider" />
          <h3 className="menu-subtitle">Daftar Produk</h3>
          <p className="hint">
            {isCentral
              ? 'Ubah nama, harga, kategori, atau sembunyikan produk. Perubahan otomatis tersimpan dan langsung tampil untuk semua pengunjung.'
              : 'Mode lokal: perubahan hanya tampil di perangkat ini. Hubungkan Google Sheets agar tampil untuk semua.'}
          </p>
          {!catLoaded && <p className="hint">Memuat data...</p>}
          <div className="feat-actions">
            <button className="btn btn-outline" onClick={addMenuRow}>
              + Tambah Produk
            </button>
            {menuSaving && <span className="hint">Menyimpan...</span>}
            {menuSaved && <span className="hint ok">Tersimpan.</span>}
          </div>
          <input
            type="text"
            className="menu-search"
            placeholder="Cari produk..."
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
          />
          {!menuDraft ? (
            <p className="hint">Menyiapkan daftar...</p>
          ) : (
            <div className="stock-list">
              {menuDraft
                .filter((r) => !menuSearch || r.name.toLowerCase().includes(menuSearch.toLowerCase()))
                .map((r) => (
                  <div key={r.id} className={`stock-row menu-row${r.active ? '' : ' off'}`}>
                    <div className="stock-info menu-info">
                      <input
                        className="menu-input"
                        value={r.name}
                        onChange={(e) => updateMenuRow(r.id, 'name', e.target.value)}
                      />
                      <input
                        className="menu-input small"
                        value={r.priceNote ?? ''}
                        placeholder="Catatan harga (opsional)"
                        onChange={(e) => updateMenuRow(r.id, 'priceNote', e.target.value)}
                      />
                    </div>
                    <div className="stock-actions">
                      <input
                        type="number"
                        min="0"
                        className="menu-price"
                        value={r.price ?? ''}
                        placeholder="Harga"
                        onChange={(e) =>
                          updateMenuRow(r.id, 'price', e.target.value === '' ? null : Number(e.target.value))
                        }
                      />
                      <select
                        className="menu-select"
                        value={r.category}
                        onChange={(e) => updateMenuRow(r.id, 'category', e.target.value)}
                      >
                        {categories.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <label className="menu-toggle">
                        <input
                          type="checkbox"
                          checked={r.active}
                          onChange={(e) => updateMenuRow(r.id, 'active', e.target.checked)}
                        />
                        Tampil
                      </label>
                      <button
                        className="btn btn-outline"
                        onClick={() => removeMenuRow(r.id)}
                        disabled={!r.active}
                        title={r.active ? 'Hapus/hilangkan produk' : 'Produk sudah tidak tampil'}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : tab === 'laporan' ? (
        <div>
          {reportError && <p className="hint warn">{reportError}</p>}
          {reportLoading && <p className="hint">Memuat laporan...</p>}

          {report && !reportError && !report[period] && (
            <p className="hint warn">
              Data laporan untuk periode ini belum tersedia. Pastikan Apps Script sudah di-deploy
              versi terbaru, lalu klik "Muat Ulang".
            </p>
          )}

          {report && !reportError && report[period] && (
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
              Perubahan otomatis tersimpan.
            </p>
            <div className="feat-actions">
              {modalSaving && <span className="hint">Menyimpan...</span>}
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
              ? 'Centang atau ubah urutan produk di "Menu Unggulan" beranda. Perubahan otomatis tersimpan untuk semua pengunjung.'
              : 'Mode lokal: perubahan hanya tampil di perangkat ini. Hubungkan Google Sheets agar tampil untuk semua pengunjung.'}
          </p>
          {!loaded && <p className="hint">Memuat data...</p>}
          <div className="feat-actions">
            {featSaving && <span className="hint">Menyimpan...</span>}
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
          <p className="hint">
            Ketik jumlah stok lalu berhenti sejenak — tersimpan otomatis. Tombol cepat tetap bisa
            dipakai.
          </p>
          {stockSaving && <p className="hint">Menyimpan stok...</p>}
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
