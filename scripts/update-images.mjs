// Skrip ganti foto produk dengan cara mudah.
// CARA PAKAI:
// 1. Taruh file foto baru di folder  new-images\  (buat otomatis kalau belum ada).
//    Nama file HARUS mengandung nama/ID produk, contoh:
//      "Ayam Bakar.png", "ayam-bakar.jpg", "sosis solo.jpeg"
// 2. Jalankan:  npm run update-images
// 3. File tersalin ke public/images\ dengan nama produk + path di
//    src/data/products.js ikut diperbarui. Produk yang ditambahkan admin
//    (di Google Sheets) juga ikut dikenali lewat namanya.
// 4. Kemudian commit + push (auto-deploy).

import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import { products } from '../src/data/products.js'
import { DEFAULT_SHEETS_URL } from '../src/utils/sheets.js'

const INPUT_DIR = 'new-images'
const OUT_DIR = 'public/images'

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

async function fetchAdminProducts() {
  try {
    const res = await fetch(`${DEFAULT_SHEETS_URL}?action=stocks&_=${Date.now()}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (data && data.ok) return data.products || []
    throw new Error('bad-response')
  } catch (err) {
    console.log(`WARN tidak bisa ambil produk dari Google Sheets (${err.message}), lanjut hanya pakai produk lokal.`)
    return []
  }
}

const index = [
  ...products.map((p) => ({
    id: p.id,
    name: p.name,
    nId: norm(p.id),
    nName: norm(p.name),
    inBase: true,
  })),
  ...(await fetchAdminProducts()).map((p) => ({
    id: p.id,
    name: p.name,
    nId: norm(p.id),
    nName: norm(p.name),
    inBase: false,
  })),
]

function findHit(nBase) {
  const exact = index.find((p) => p.nId === nBase || p.nName === nBase)
  if (exact) return { hit: exact, ambiguous: false }
  const contains = index.filter(
    (p) => p.nName.includes(nBase) || nBase.includes(p.nName) || nBase.includes(p.nId),
  )
  if (contains.length === 1) return { hit: contains[0], ambiguous: false }
  if (contains.length > 1) return { hit: null, ambiguous: true }
  return { hit: null, ambiguous: false }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  await mkdir(INPUT_DIR, { recursive: true })

  const files = (await readdir(INPUT_DIR)).filter((f) => !f.startsWith('.'))
  if (!files.length) {
    console.log(`Tidak ada file di folder ${INPUT_DIR}. Taruh foto di sana, lalu jalankan lagi.`)
    return
  }

  const matched = []
  const skipped = []
  const seen = new Set()

  for (const file of files) {
    const base = file.replace(/\.[^.]+$/, '')
    const ext = extname(file).toLowerCase() || '.jpg'
    const { hit, ambiguous } = findHit(norm(base))

    if (!hit) {
      skipped.push(
        ambiguous
          ? `${file}  -> NAMA AMBIGU, cocok lebih dari 1 produk. Beri nama lebih spesifik.`
          : `${file}  -> tidak cocok dengan produk manapun.`,
      )
      continue
    }

    if (seen.has(hit.id)) {
      skipped.push(`${file}  -> dilewati (sudah ada file lain untuk produk "${hit.name}").`)
      continue
    }
    seen.add(hit.id)

    const dest = join(OUT_DIR, `${hit.id}${ext}`)
    await copyFile(join(INPUT_DIR, file), dest)
    matched.push({ id: hit.id, name: hit.name, file, ext, inBase: hit.inBase })
    console.log(`OK   ${file}  ->  ${hit.id}${ext}  (${hit.name})${hit.inBase ? '' : '  [produk admin]'}`)
  }

  if (matched.length) {
    let prod = readFileSync('src/data/products.js', 'utf8')
    let patched = 0
    for (const m of matched) {
      if (!m.inBase) continue
      const re = new RegExp(`(image: 'images/)${m.id}\\.[a-z0-9]+(')`, 'i')
      if (re.test(prod)) {
        prod = prod.replace(re, `$1${m.id}${m.ext}$2`)
        patched++
      } else {
        console.log(`WARN path gambar "${m.id}" tidak ditemukan di products.js, cek manual.`)
      }
    }
    if (patched) {
      writeFileSync('src/data/products.js', prod)
      console.log(`\nBerhasil: ${matched.length} foto dipasang, ${patched} path products.js diperbarui.`)
    } else {
      console.log(`\nBerhasil: ${matched.length} foto dipasang (foto produk admin langsung dikenali oleh sistem).`)
    }
  } else {
    console.log('\nTidak ada foto yang berhasil dipasang.')
  }

  if (skipped.length) {
    console.log('\nDilewati / tidak cocok:')
    skipped.forEach((s) => console.log('  -', s))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
