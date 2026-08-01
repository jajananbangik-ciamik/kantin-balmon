import { copyFile, mkdir } from 'node:fs/promises'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'

const STORE = 'D:\\DATA\\PRIVATE\\DAGANG\\Store'
const outDir = 'public/images'

const map = {
  'sosis-solo': 'Sosis Solo Goreng.jpeg',
  'ayam-bakar': 'Ayam Bakar.png',
  'ayam-ungkep': 'Ayam Bakar.png',
  'rendang': 'Lauk Pauk/rendang.jpg',
  'pempek-grade-a': 'pempek.jpg',
  'pempek-grade-b': 'pempek.jpg',
  'siomay-tenggiri': 'siomay.png',
  'siomay-grade-b': 'siomay.png',
  'otak-otak': 'Otak2 Ikan.png',
  'beng-beng': 'Snack/Beng beng.jpg',
  'saltcheese': 'Snack/Saltcheese.jpg',
  'better': 'Snack/Better.png',
  'sari-gandum': 'Snack/sari gandum.jpg',
  'brownies-crispy': 'Snack/Tanggo Brownies.jpg',
  'marie-regal': 'Snack/Marie Regal.jpg',
  'kripik-sanjay': 'Cemilan Besar/Kripik Sanjay Ante.png',
  'stik-bawang': 'Cemilan Besar/Stik Bawang.jpeg',
  'marning': 'Cemilan Besar/Marning.jpeg',
  'rengginang': 'Cemilan Besar/Rengginang.jpeg',
  'bagelen': 'Cemilan Besar/Bagelen.jpeg',
  'kripik-usus': 'Cemilan Besar/Kripik Usus.jpeg',
  'basreng': 'Cemilan Besar/Basreng.jpeg',
  'tahu-walik': 'Cemilan Besar/Tahu Walik.jpeg',
  'kripik-nangka': 'Cemilan Besar/Keripik Nangka.jpeg',
  'muli': 'Cemilan Besar/Kripik Muli.jpeg',
  'grubi': 'Cemilan Besar/Grubi.jpeg',
  'soes-coklat': 'Cemilan Besar/Soes Coklat.jpeg',
  'sprei-kaos': 'Confetti/Confetti.jpeg',
}

await mkdir(outDir, { recursive: true })
const extMap = {}
for (const [id, rel] of Object.entries(map)) {
  const srcPath = join(STORE, rel)
  const ext = extname(srcPath).toLowerCase() || '.jpg'
  const dest = join(outDir, `${id}${ext}`)
  try {
    await copyFile(srcPath, dest)
    extMap[id] = ext
    console.log('OK  ', id, ext)
  } catch (e) {
    console.log('FAIL', id, e.message)
  }
}

let prod = readFileSync('src/data/products.js', 'utf8')
for (const [id, ext] of Object.entries(extMap)) {
  prod = prod.replace(new RegExp(`image: '/images/${id}\\.jpg'`), `image: '/images/${id}${ext}'`)
}
writeFileSync('src/data/products.js', prod)
console.log('patched products.js for', Object.keys(extMap).length, 'images')
