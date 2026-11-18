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
    if (!String(e.name ?? '').trim()) return
    const hidden = e.active === false
    if (hidden && !includeInactive) return
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
  const [fetchOk, setFetchOk] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const inFlightRef = useRef(false)

  const isCentral = !!getSheetsUrl()
  const ready = isCentral ? loaded && fetchOk : loaded

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
        setFetchOk(true)
      } else {
        setFetchOk(false)
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
    const editMap = new Map(catEdits.map((c) => [c.slug, c]))
    const list = baseCategories.map((b, i) => {
      const e = editMap.get(b.slug)
      return {
        slug: b.slug,
        name: e && e.name ? e.name : b.name,
        tagline: b.tagline,
        order: e && e.order != null ? e.order : i + 1,
        active: e ? e.active !== false : true,
      }
    })
    catEdits.forEach((e) => {
      if (baseCategories.some((b) => b.slug === e.slug) || e.active === false) return
      list.push({
        slug: e.slug,
        name: e.name || e.slug,
        tagline: '',
        order: e.order == null ? Number.MAX_SAFE_INTEGER : e.order,
        active: true,
      })
    })
    return list
      .filter((c) => c.active)
      .sort((a, b) => a.order - b.order)
      .map(({ slug, name, tagline }) => ({ slug, name, tagline }))
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
    if (isCentral && !ready) return { ok: false, reason: 'not-ready' }
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
  }, [isCentral, ready])

  const saveCatalog = useCallback(
    async (list, { deleteIds = [] } = {}) => {
      const url = getSheetsUrl()
      if (!url) return { ok: false, reason: 'not-configured' }
      if (isCentral && !ready) return { ok: false, reason: 'not-ready' }
      const norm = (p) => ({
        id: String(p.id),
        name: String(p.name || ''),
        category: String(p.category || ''),
        price: p.price !== null && p.price !== '' && p.price != null ? Number(p.price) : null,
        priceNote: String(p.priceNote || ''),
        active: p.active !== false,
      })
      // Ambil keadaan sheet terbaru dulu. Draft admin bisa saja lama karena
      // perangkat lain menambah produk setelah halaman ini dibuka.
      const fresh = await fetchStocks()
      if (!fresh.ok) {
        await refresh()
        return { ok: false, reason: fresh.reason || 'stale' }
      }
      const map = new Map()
      ;(fresh.products || []).forEach((p) => {
        const id = String(p.id || '')
        if (id && String(p.name || '').trim() && !map.has(id)) map.set(id, norm(p))
      })
      baseProducts.forEach((b) => {
        if (!map.has(b.id)) map.set(b.id, norm(b))
      })
      ;(Array.isArray(list) ? list : []).forEach((p) => {
        const id = p && p.id != null ? String(p.id) : ''
        if (!id || !String(p.name || '').trim()) return
        map.set(id, norm(p))
      })
      const removed = new Set((Array.isArray(deleteIds) ? deleteIds : []).map(String))
      removed.forEach((id) => map.delete(id))
      const res = await saveProducts(Array.from(map.values()), {
        deleteIds: Array.from(removed),
      })
      if (!res.ok) {
        await refresh()
        return res
      }
      setEdits(res.products || [])
      setFetchOk(true)
      return res
    },
    [isCentral, ready, refresh],
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
      ready,
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
      ready,
      isCentral,
    ],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog() {
  return useContext(CatalogContext)
}
