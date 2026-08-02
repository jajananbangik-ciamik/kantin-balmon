export const SHEETS_URL_KEY = 'kantin-balmon-sheets-url'
export const STOCK_TOKEN_KEY = 'kantin-balmon-stock-token'

export const DEFAULT_SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbygKUxBaa3Jk1IRNArPnWGtoICSU20JsgZxLEYrpdQaXMCVcOfETMjcunqzM4-Attwuxw/exec'

export const getSheetsUrl = () => {
  try {
    return localStorage.getItem(SHEETS_URL_KEY) || DEFAULT_SHEETS_URL
  } catch {
    return DEFAULT_SHEETS_URL
  }
}

export const setSheetsUrl = (url) => {
  try {
    localStorage.setItem(SHEETS_URL_KEY, url)
    window.dispatchEvent(new Event('kantin-balmon-sheets-url'))
  } catch {
    /* ignore */
  }
}

export const getStockToken = () => {
  try {
    return localStorage.getItem(STOCK_TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export const setStockToken = (token) => {
  try {
    localStorage.setItem(STOCK_TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}

export async function verifyAdmin(password) {
  const url = getSheetsUrl()
  if (!url) return { ok: false, reason: 'not-configured' }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'verifyAdmin', token: password }),
    })
    if (!res.ok) return { ok: false, reason: 'http-' + res.status }
    const data = await res.json()
    if (data && data.ok) return { ok: true }
    if (data && data.error) return { ok: false, reason: data.error }
    return { ok: false, reason: 'bad-response' }
  } catch (err) {
    return { ok: false, reason: err.message }
  }
}

export async function sendOrderToSheets(order) {
  const url = getSheetsUrl()
  if (!url) return { ok: false, reason: 'not-configured' }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(order),
    })
    if (!res.ok) return { ok: false, reason: 'http-' + res.status }
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: err.message }
  }
}

export async function fetchStocks() {
  const url = getSheetsUrl()
  if (!url) return { ok: false, reason: 'not-configured' }
  try {
    const res = await fetch(`${url}?action=stocks&_=${Date.now()}`)
    if (!res.ok) return { ok: false, reason: 'http-' + res.status }
    const data = await res.json()
    if (data && data.ok) {
      return {
        ok: true,
        stocks: data.stocks || {},
        featured: data.featured || [],
        products: data.products || [],
        categories: data.categories || [],
      }
    }
    return { ok: false, reason: 'bad-response' }
  } catch (err) {
    return { ok: false, reason: err.message }
  }
}

export async function saveProducts(rows) {
  const url = getSheetsUrl()
  if (!url) return { ok: false, reason: 'not-configured' }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'setProducts', products: rows, token: getStockToken() }),
    })
    if (!res.ok) return { ok: false, reason: 'http-' + res.status }
    const data = await res.json()
    if (data && data.ok) return { ok: true, products: data.products || [] }
    if (data && data.error) return { ok: false, reason: data.error }
    return { ok: false, reason: 'bad-response' }
  } catch (err) {
    return { ok: false, reason: err.message }
  }
}

export async function saveCategories(rows) {
  const url = getSheetsUrl()
  if (!url) return { ok: false, reason: 'not-configured' }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'setCategories', categories: rows, token: getStockToken() }),
    })
    if (!res.ok) return { ok: false, reason: 'http-' + res.status }
    const data = await res.json()
    if (data && data.ok) return { ok: true, categories: data.categories || [] }
    if (data && data.error) return { ok: false, reason: data.error }
    return { ok: false, reason: 'bad-response' }
  } catch (err) {
    return { ok: false, reason: err.message }
  }
}

export async function setFeatured(ids) {
  const url = getSheetsUrl()
  if (!url) return { ok: false, reason: 'not-configured' }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'setFeatured', ids, token: getStockToken() }),
    })
    if (!res.ok) return { ok: false, reason: 'http-' + res.status }
    const data = await res.json()
    if (data && data.ok) {
      return { ok: true, stocks: data.stocks || {}, featured: data.featured || [] }
    }
    if (data && data.error) return { ok: false, reason: data.error }
    return { ok: false, reason: 'bad-response' }
  } catch (err) {
    return { ok: false, reason: err.message }
  }
}

export async function fetchReport() {
  const url = getSheetsUrl()
  if (!url) return { ok: false, reason: 'not-configured' }
  try {
    const token = encodeURIComponent(getStockToken())
    const res = await fetch(`${url}?action=report&token=${token}&_=${Date.now()}`)
    if (!res.ok) return { ok: false, reason: 'http-' + res.status }
    const data = await res.json()
    if (data && data.ok) {
      return { ok: true, periods: data.periods || {}, modals: data.modals || {} }
    }
    if (data && data.error) return { ok: false, reason: data.error }
    return { ok: false, reason: 'bad-response' }
  } catch (err) {
    return { ok: false, reason: err.message }
  }
}

export async function saveModals(modals) {
  const url = getSheetsUrl()
  if (!url) return { ok: false, reason: 'not-configured' }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'setModals', modals, token: getStockToken() }),
    })
    if (!res.ok) return { ok: false, reason: 'http-' + res.status }
    const data = await res.json()
    if (data && data.ok) return { ok: true, modals: data.modals || {} }
    if (data && data.error) return { ok: false, reason: data.error }
    return { ok: false, reason: 'bad-response' }
  } catch (err) {
    return { ok: false, reason: err.message }
  }
}

export async function sendStockAction(action, productId, value) {
  const url = getSheetsUrl()
  if (!url) return { ok: false, reason: 'not-configured' }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, productId, value, token: getStockToken() }),
    })
    if (!res.ok) return { ok: false, reason: 'http-' + res.status }
    const data = await res.json()
    if (data && data.ok && data.stocks) return { ok: true, stocks: data.stocks }
    if (data && data.error) return { ok: false, reason: data.error }
    return { ok: false, reason: 'bad-response' }
  } catch (err) {
    return { ok: false, reason: err.message }
  }
}
