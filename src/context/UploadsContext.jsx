import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getSheetsUrl, fetchStocks, saveProductImage, removeProductImage } from '../utils/sheets'

const UploadsContext = createContext(null)
const STORAGE_KEY = 'kantin-balmon-uploads'

const loadUploads = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

export function resizeImageFile(file, maxSize = 320) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)

      let size = maxSize
      let quality = 0.8
      let dataUrl = canvas.toDataURL('image/jpeg', quality)
      while (dataUrl.length > 44000 && size > 120) {
        size = Math.floor(size * 0.8)
        const s = Math.min(1, size / Math.max(w, h))
        const nw = Math.max(1, Math.round(w * s))
        const nh = Math.max(1, Math.round(h * s))
        canvas.width = nw
        canvas.height = nh
        canvas.getContext('2d').drawImage(img, 0, 0, nw, nh)
        quality = Math.max(0.4, quality - 0.15)
        dataUrl = canvas.toDataURL('image/jpeg', quality)
      }
      resolve(dataUrl)
    }
    img.onerror = reject
    img.src = url
  })
}

export function UploadsProvider({ children }) {
  const [uploads, setUploads] = useState(loadUploads)
  const [centralImages, setCentralImages] = useState({})
  const [centralLoaded, setCentralLoaded] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads))
  }, [uploads])

  const refresh = async () => {
    if (!getSheetsUrl()) {
      setCentralLoaded(true)
      return { ok: false, reason: 'not-configured' }
    }
    const res = await fetchStocks()
    if (res.ok) {
      setCentralImages(res.images || {})
      setCentralLoaded(true)
    }
    return res
  }

  useEffect(() => {
    refresh()
    const onUrlChange = () => refresh()
    window.addEventListener('kantin-balmon-sheets-url', onUrlChange)
    return () => window.removeEventListener('kantin-balmon-sheets-url', onUrlChange)
  }, [])

  const setUpload = async (productId, dataUrl) => {
    setUploads((prev) => ({ ...prev, [productId]: dataUrl }))
    setCentralImages((prev) => ({ ...prev, [productId]: dataUrl }))
    if (!getSheetsUrl()) return { ok: false, reason: 'not-configured' }
    const res = await saveProductImage(productId, dataUrl)
    if (res.ok) {
      setCentralImages((prev) => ({ ...prev, [productId]: res.images[productId] ?? dataUrl }))
    }
    return res
  }

  const removeUpload = async (productId) => {
    setUploads((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
    setCentralImages((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
    if (!getSheetsUrl()) return { ok: false, reason: 'not-configured' }
    return removeProductImage(productId)
  }

  const value = useMemo(
    () => ({
      uploads,
      centralImages,
      centralLoaded,
      setUpload,
      removeUpload,
      refreshUploads: refresh,
    }),
    [uploads, centralImages, centralLoaded],
  )
  return <UploadsContext.Provider value={value}>{children}</UploadsContext.Provider>
}

export function useUploads() {
  return useContext(UploadsContext)
}