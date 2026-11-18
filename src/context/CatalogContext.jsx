import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { products as baseProducts, categories as baseCategories } from '../data/products'
import { getSheetsUrl, fetchStocks, saveProducts, saveCategories as saveCategoriesReq } from '../utils/sheets'
import { useLiveRefresh } from '../hooks/useLiveRefresh'

const CatalogContext = createContext(null)

const CATEGORY_ORDER = {}
baseCategories.forEach((c, i) => (CATEGORY_ORDER[c.slug] = i))
const MAX_CAT_ORDER = Number.MAX_SAFE_INTEGER

function mergeCatalog(base, edits, { includeInactive = false } = {}) {
  const map = {}
  edits.forEach((e) => (map[e.id] = e))
  const list = []
  base.forEach((b) => {
    const e = map[b.id]
    if (!e) {
      list.push(b)
      return
    }
    const hasName = String(e.name ?? '').trim() !== ''
    const hidden = e.active === false
    // Baris "tersembunyi" tanpa nama adalah sisa bug lama (bukan sembunyi sengaja).
    // Abaikan agar produk bawaan pulih otomatis.
    if (hidden && !hasName) {
      list.push(b)
      return
    }
    if (hidden && !includeInactive) return
    list.push({
      ...b,
      name: hasName ? e.name : b.name,
      category: e.category || b.category,
      price: e.price !== null && e.price !== '' ? Number(e.price) : null,
      priceNote: (e.priceNote ?? '') !== '' ? e.priceNote : b.priceNote,
      active: !hidden,
    })
  })
  edits.forEach((e) => {
    if (base.some((b) => b.id === e.id)) return
    const hidden = e.active === false
    if (hidden && (!includeInactive || !String(e.name || '').trim())) return
    list.push({
      id: e.id,
      name: e.name || '',
      category: e.category || (baseCategories[0] && baseCategories[0].slug) || '',
      price: e.price !== null && e.price !== '' ? Number(e.price) : null,
      priceNote: e.priceNote || '',
      image: '',
      active: !hidden,
    })
  })

  const seen = new Set()
  const deduped = []
  list.forEach((p) => {
    const idKey = String(p.id || '')
    const nameKey = String(p.name || '').trim().toLowerCase()
    if (seen.has(idKey) || (nameKey && seen.has('n:' + nameKey))) return
    seen.add(idKey)
    if (nameKey) seen.add('n:' + nameKey)
    deduped.push(p)
  })

  return deduped.sort((a, b) => {
    const ao = CATEGORY_ORDER[a.category] ?? MAX_CAT_ORDER
    const bo = CATEGORY_ORDER[b.category] ?? MAX_CAT_ORDER
    if (ao !== bo) return ao - bo
    return String(a.name || '').localeCompare(String(b.name || ''), 'id', { sensitivity: 'base' })
  })
}

export function CatalogProvider({ children }) {
  const [edits, setEdits] = useState([])
  const [catEdits, setCatEdits] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const inFlightRef = useRef(false)

  const isCentral = !!getSheetsUrl()

  const refresh = useCallback(async ({ silent = false } = {}) => {
    const url = getSheetsUrl()
    if (!url) {
      setLoaded(true)
      return { ok: false, reason: 'not-configured' }
    }
    if (inFlightRef.current) return { ok: false, reason: 'in-flight' }
    inFlightRef.current = true
    if (!silent) setSyncing(true)
    try {
      const res = await fetchStocks()
      if (res.ok) {
        setEdits(res.products || [])
        setCatEdits(res.categories || [])
      }
      setLoaded(true)
      return res
    } finally {
      inFlightRef.current = false
      if (!silent) setSyncing(false)
    }
  }, [])

  const liveRefresh = useCallback(() => refresh({ silent: true }), [refresh])

  useEffect(() => {
    refresh()
    const onUrlChange = () => refresh()
    window.addEventListener('kantin-balmon-sheets-url', onUrlChange)
    return () => window.removeEventListener('kantin-balmon-sheets-url', onUrlChange)
  }, [refresh])

  useLiveRefresh(liveRefresh, { enabled: isCentral })

  const products = useMemo(() => mergeCatalog(baseProducts, edits), [edits])
  const allProducts = useMemo(
    () => mergeCatalog(baseProducts, edits, { includeInactive: true }),
    [edits],
  )
  const categories = useMemo(() => {
    if (!catEdits.length) return baseCategories
    return catEdits
      .filter((c) => c.active !== false)
      .slice()
      .sort((a, b) => {
        const ao = a.order == null ? Number.MAX_SAFE_INTEGER : a.order
        const bo = b.order == null ? Number.MAX_SAFE_INTEGER : b.order
        return ao - bo
      })
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        tagline: (baseCategories.find((b) => b.slug === c.slug) || {}).tagline || '',
      }))
  }, [catEdits])

  const getProduct = useCallback((id) => products.find((p) => p.id === id) || null, [products])
  const getProductsByCategory = useCallback(
    (slug) => products.filter((p) => p.category === slug),
    [products],
  )
  const getCategory = useCallback(
    (slug) => categories.find((c) => c.slug === slug) || null,
    [categories],
  )

  const saveCategories = useCallback(async (list) => {
    const url = getSheetsUrl()
    if (!url) return { ok: false, reason: 'not-configured' }
    const rows = list.map((c, i) => ({
      slug: String(c.slug || '').trim(),
      name: c.name || c.slug || '',
      order: i + 1,
      active: c.active !== false,
    }))
    const res = await saveCategoriesReq(rows)
    if (!res.ok) return res
    setCatEdits(res.categories || [])
    return res
  }, [])

  const saveCatalog = useCallback(
    async (list) => {
      const url = getSheetsUrl()
      if (!url) return { ok: false, reason: 'not-configured' }
      // Kirim SNAPSHOT LENGKAP (bukan diff) karena server mengganti seluruh
      // isi sheet "Produk". Ini mencegah produk lain ikut terhapus.
      const rows = []
      const seen = new Set()
      ;(Array.isArray(list) ? list : []).forEach((p) => {
        const id = p && p.id != null ? String(p.id) : ''
        if (!id || seen.has(id)) return
        seen.add(id)
        rows.push({
          id,
          name: p.name || '',
          category: p.category || '',
          price: p.price !== null && p.price !== '' && p.price != null ? Number(p.price) : null,
          priceNote: p.priceNote || '',
          active: p.active !== false,
        })
      })
      baseProducts.forEach((b) => {
        if (seen.has(b.id)) return
        rows.push({
          id: b.id,
          name: b.name,
          category: b.category,
          price: b.price != null ? b.price : null,
          priceNote: b.priceNote || '',
          active: false,
        })
      })
      const res = await saveProducts(rows)
      if (!res.ok) {
        await refresh()
        return res
      }
      setEdits(res.products || [])
      return res
    },
    [refresh],
  )

  const value = useMemo(
    () => ({
      products,
      allProducts,
      categories,
      catEdits,
      getProduct,
      getProductsByCategory,
      getCategory,
      saveCatalog,
      saveCategories,
      refresh,
      syncing,
      loaded,
      isCentral,
    }),
    [
      products,
      allProducts,
      categories,
      catEdits,
      getProduct,
      getProductsByCategory,
      getCategory,
      saveCatalog,
      saveCategories,
      refresh,
      syncing,
      loaded,
      isCentral,
    ],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  return useContext(CatalogContext)
}
