const CACHE_PREFIX = 'kantin-balmon-v6'
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names
          .filter((name) => name.startsWith('kantin-balmon-'))
          .map((name) => caches.delete(name))
      )
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(`${CACHE_PREFIX}-current`).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(`${url.origin}/index.html`))
        )
    )
    return
  }

  // Gambar: selalu ambil versi terbaru dari jaringan agar foto produk yang
  // baru dipasang langsung tampil (fallback ke cache hanya saat offline).
  if (IMAGE_EXT.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone()
            caches.open(`${CACHE_PREFIX}-current`).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Bundle JS/CSS harus selalu segar: cached || network membuat perangkat
  // lama terus menjalankan kode sebelum perbaikan.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone()
          caches.open(`${CACHE_PREFIX}-current`).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})
