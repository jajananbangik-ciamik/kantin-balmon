import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { imageSources } from '../src/data/imageSources.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'images')

const images = Object.fromEntries(
  Object.entries(imageSources).map(([id, url]) => [`${id}.jpg`, url]),
)

await mkdir(outDir, { recursive: true })

let ok = 0
let failed = 0
for (const [file, url] of Object.entries(images)) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Referer': 'https://sites.google.com/view/jajanan-lauk/',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    await writeFile(join(outDir, file), buf)
    ok++
    console.log(`OK   ${file}`)
  } catch (err) {
    failed++
    console.log(`FAIL ${file} (${err.message})`)
  }
}

console.log(`\nSelesai: ${ok} berhasil, ${failed} gagal.`)
