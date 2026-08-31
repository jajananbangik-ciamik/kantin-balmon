import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getSheetsUrl, fetchStocks, sendStockAction, setFeatured as postFeatured } from '../utils/sheets'

const StockContext = createContext(null)
const LOCAL_KEY = 'kantin-balmon-stock'

const loadLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {}
  } catch {
    return {}
  }
}

const dedupe = (ids) => Array.from(new Set(ids))

export function StockProvider({ children }) {
  // central = null artinya mode lokal (URL Google Sheets belum diatur)
  const [central, setCentral] = useState(null)
  const [localStocks, setLocalStocks] = useState(loadLocal)
  const [featured, setFeatured] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const inFlightRef = useRef(false)
  const hasLoadedRef = useRef(false)

  const isCentral = central !== null

  const refresh = useCallback(async () => {
    const url = getSheetsUrl()
    if (!url) {
      setCentral(null)
      hasLoadedRef.current = true
      setLoaded(true)
      return { ok: false, reason: 'not-configured' }
    }
    if (inFlightRef.current) return { ok: false, reason: 'in-flight' }
    inFlightRef.current = true
    setSyncing(true)
    try {
      const res = await fetchStocks()
      if (res.ok) {
        setCentral(res.stocks)
        setFeatured(dedupe(res.featured || []))
      } else if (!hasLoadedRef.current) {
        setCentral({})
        setFeatured([])
      }
      hasLoadedRef.current = true
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

  const getStock = useCallback(
    (productId) => {
      if (isCentral) return productId in central ? central[productId] : null
      return productId in localStocks ? localStocks[productId] : null
    },
    [isCentral, central, localStocks],
  )

  const setStock = useCallback(
    async (productId, value) => {
      if (isCentral) {
        const n = Math.max(0, Math.round(Number(value) || 0))
        setCentral((prev) => ({ ...prev, [productId]: n }))
        const res = await sendStockAction('setStock', productId, n)
        if (!res.ok) {
          await refresh()
          return res
        }
        setCentral(res.stocks)
        return res
      }
      const n = Math.max(0, Math.round(Number(value) || 0))
      setLocalStocks((prev) => ({ ...prev, [productId]: n }))
      return { ok: true }
    },
    [isCentral, refresh],
  )

  const removeStock = useCallback(
    async (productId) => {
      if (isCentral) {
        setCentral((prev) => {
          const next = { ...prev }
          delete next[productId]
          return next
        })
        const res = await sendStockAction('removeStock', productId, null)
        if (!res.ok) {
          await refresh()
          return res
        }
        setCentral(res.stocks)
        return res
      }
      setLocalStocks((prev) => {
        const next = { ...prev }
        delete next[productId]
        return next
      })
      return { ok: true }
    },
    [isCentral, refresh],
  )

  const decrementStock = useCallback(
    async (productId, qty) => {
      if (isCentral) return { ok: true }
      setLocalStocks((prev) =>
        productId in prev ? { ...prev, [productId]: Math.max(0, (prev[productId] ?? 0) - qty) } : prev,
      )
      return { ok: true }
    },
    [isCentral],
  )

  const updateFeatured = useCallback(
    async (ids) => {
      const next = dedupe(ids)
      setFeatured(next)
      const res = await postFeatured(next)
      if (!res.ok) {
        await refresh()
        return res
      }
      if (res.stocks) setCentral(res.stocks)
      return res
    },
    [refresh],
  )

  const value = useMemo(
    () => ({
      getStock,
      setStock,
      removeStock,
      decrementStock,
      refresh,
      syncing,
      loaded,
      isCentral,
      featured,
      updateFeatured,
    }),
    [getStock, setStock, removeStock, decrementStock, refresh, syncing, loaded, isCentral, featured, updateFeatured],
  )

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>
}

export function useStock() {
  return useContext(StockContext)
}
