import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const UploadsContext = createContext(null)
const STORAGE_KEY = 'kantin-balmon-uploads'

const loadUploads = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

export function resizeImageFile(file, maxSize = 480) {
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
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = url
  })
}

export function UploadsProvider({ children }) {
  const [uploads, setUploads] = useState(loadUploads)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads))
  }, [uploads])

  const setUpload = (productId, dataUrl) => {
    setUploads((prev) => ({ ...prev, [productId]: dataUrl }))
  }

  const removeUpload = (productId) => {
    setUploads((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }

  const value = useMemo(() => ({ uploads, setUpload, removeUpload }), [uploads])
  return <UploadsContext.Provider value={value}>{children}</UploadsContext.Provider>
}

export function useUploads() {
  return useContext(UploadsContext)
}
