import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getProduct } from '../data/products'

const CartContext = createContext(null)
const STORAGE_KEY = 'kantin-balmon-cart'

const loadCart = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const lineId = (productId, variantLabel) => `${productId}::${variantLabel || ''}`

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (product, variantLabel, qty = 1) => {
    const id = lineId(product.id, variantLabel)
    setItems((prev) => {
      const existing = prev.find((i) => lineId(i.productId, i.variantLabel) === id)
      if (existing) {
        return prev.map((i) =>
          lineId(i.productId, i.variantLabel) === id ? { ...i, qty: i.qty + qty } : i,
        )
      }
      return [...prev, { productId: product.id, variantLabel: variantLabel || null, qty }]
    })
  }

  const increment = (productId, variantLabel) => {
    const id = lineId(productId, variantLabel)
    setItems((prev) =>
      prev.map((i) => (lineId(i.productId, i.variantLabel) === id ? { ...i, qty: i.qty + 1 } : i)),
    )
  }

  const decrement = (productId, variantLabel) => {
    const id = lineId(productId, variantLabel)
    setItems((prev) =>
      prev
        .map((i) => (lineId(i.productId, i.variantLabel) === id ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0),
    )
  }

  const removeItem = (productId, variantLabel) => {
    const id = lineId(productId, variantLabel)
    setItems((prev) => prev.filter((i) => lineId(i.productId, i.variantLabel) !== id))
  }

  const clearCart = () => setItems([])

  const linePrice = (item) => {
    const product = getProduct(item.productId)
    if (!product) return null
    if (item.variantLabel && product.variants) {
      const v = product.variants.find((x) => x.label === item.variantLabel)
      return v ? v.price : null
    }
    return product.price ?? null
  }

  const itemCount = items.reduce((s, i) => s + i.qty, 0)
  const subtotal = items.reduce((s, i) => s + (linePrice(i) ?? 0) * i.qty, 0)

  const value = useMemo(
    () => ({ items, addItem, increment, decrement, removeItem, clearCart, linePrice, itemCount, subtotal }),
    [items, itemCount, subtotal],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}
