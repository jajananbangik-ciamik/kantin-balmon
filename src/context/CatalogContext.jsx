import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { products as baseProducts, categories as baseCategories } from '../data/products'
import { getSheetsUrl, fetchStocks, saveProducts, saveCategories as saveCategoriesReq } from '../utils/sheets'

const CatalogContext = createContext(null)

function mergeCatalog(base, edits) {
  const map = {}
  edits.forEach((e) => (map[e.id] = e))
  const list = []
  base.forEach((b) => {
    const e = map[b.id]
    if (e && e.active === false) return
    if (e) {
      list.push({
        ...b,
        name: e.name ?? b.name,
        category: e.category || b.category,
        price: e.price !== null && e.price !== '' ? Number(e.price) : null,
        priceNote: e.priceNote !== undefined ? e.priceNote : b.priceNote,
      })
    } else {
      list.push(b)
    }
  })
  edits.forEach((e) => {
    if (base.some((b) => b.id === e.id)) return
    if (e.active === false) return
    list.push({
      id: e.id,
      name: e.name || '',
      category: e.category || (baseCategories[0] && baseCategories[0].slug) || '',
      price: e.price !== null && e.price !== '' ? Number(e.price) : null,
      priceNote: e.priceNote || '',
      image: '',
    })
  })
  return list
}

export function CatalogProvider({ children }) {
  const [edits, setEdits] = useState([])
  const [catEdits, setCatEdits] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const inFlightRef = useRef(false)

  const isCentral = !!getSheetsUrl()

  const refresh = useCallback(async () => {
    const url = getSheetsUrl()
    if (!url) {
      setLoaded(true)
      return { ok: false, reason: 'not-configured' }
    }
    if (inFlightRef.current) return { ok: false, reason: 'in-flight' }
    inFlightRef.current = true
    setSyncing(true)
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
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const onUrlChange = () => refresh()
    window.addEventListener('kantin-balmon-sheets-url', onUrlChange)
    return () => window.removeEventListener('kantin-balmon-sheets-url', onUrlChange)
  }, [refresh])

  const products = useMemo(() => mergeCatalog(baseProducts, edits), [edits])
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
      const diff = []
      list.forEach((p) => {
        const b = baseProducts.find((x) => x.id === p.id)
        if (!b) {
          if (p.active === false) return
          diff.push({
            id: p.id,
            name: p.name || '',
            category: p.category,
            price: p.price !== null && p.price !== '' ? Number(p.price) : null,
            priceNote: p.priceNote || '',
            active: true,
          })
          return
        }
        if (p.active === false) {
          diff.push({ id: p.id, active: false })
          return
        }
        const changed =
          (p.name ?? b.name) !== b.name ||
          (p.category ?? b.category) !== b.category ||
          (p.price ?? b.price) !== b.price ||
          (p.priceNote ?? '') !== (b.priceNote ?? '')
        if (changed) {
          diff.push({
            id: p.id,
            name: p.name ?? b.name,
            category: p.category ?? b.category,
            price: p.price !== null && p.price !== '' ? Number(p.price) : null,
            priceNote: p.priceNote ?? b.priceNote ?? '',
            active: true,
          })
        }
      })
      baseProducts.forEach((b) => {
        if (!list.some((p) => p.id === b.id)) diff.push({ id: b.id, active: false })
      })
      const res = await saveProducts(diff)
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
