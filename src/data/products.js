export const categories = [
  { slug: 'frozen', name: 'Jajanan Frozen', tagline: 'Pertolongan pertama pada kelaparan' },
  { slug: 'olahan-ikan', name: 'Olahan Ikan', tagline: 'Pempek, siomay, otak-otak & kerupuk' },
  { slug: 'lauk-pauk', name: 'Lauk Pauk', tagline: 'Rendang, sop daging, ayam ungkep & bakar' },
  { slug: 'ikan-seafood', name: 'Ikan & Seafood', tagline: 'Ikan bakar & cumi asin' },
  { slug: 'snack', name: 'Snack', tagline: 'Camilan ringan siap santap' },
  { slug: 'aneka-cemilan', name: 'Aneka Cemilan', tagline: 'Jajanan kering tradisional' },
  { slug: 'kebutuhan-rumah', name: 'Kebutuhan Rumah', tagline: 'Sprei berbahan kaos premium' },
]

export const products = [
  // ---- Jajanan Frozen ----
  { id: 'sosis-solo', name: 'Sosis Solo', category: 'frozen', price: 25000, priceNote: 'Isi 10', image: 'images/sosis-solo.jpeg' },
  { id: 'dimsum-orange', name: 'Dimsum Orange', category: 'frozen', price: 25000, priceNote: 'Isi 10', image: 'images/dimsum-orange.jpeg' },
  { id: 'dimsum-mozarella', name: 'Dimsum Goreng Mozarella', category: 'frozen', price: 27000, priceNote: 'Isi 5', image: 'images/dimsum-mozarella.jpeg' },
  { id: 'wonton', name: 'Wonton', category: 'frozen', price: 16000, priceNote: '1 porsi + kuah sop & chili oil', image: 'images/wonton.jpeg' },
  { id: 'pizza', name: 'Pizza', category: 'frozen', price: 26000, image: 'images/pizza.jpeg' },
  { id: 'pancake-buah', name: 'Pancake Buah', category: 'frozen', price: 16000, priceNote: 'Ukuran kecil', image: 'images/pancake-buah.jpeg' },
  { id: 'es-serut-durian', name: 'Es Serut Durian', category: 'frozen', price: 18000, image: 'images/es-serut-durian.jpeg' },
  { id: 'durian-monthong', name: 'Durian Monthong', category: 'frozen', price: 66000, image: 'images/durian-monthong.jpeg' },

  // ---- Olahan Ikan ----
  { id: 'pempek-grade-a', name: 'Pempek Ikan Grade A', category: 'olahan-ikan', price: 2500, priceNote: 'per satuan', image: 'images/pempek-grade-a.jpg' },
  { id: 'pempek-grade-b', name: 'Pempek Ikan Grade B', category: 'olahan-ikan', price: 2000, priceNote: 'per satuan', image: 'images/pempek-grade-b.jpeg' },
  { id: 'siomay-tenggiri', name: 'Siomay Tenggiri', category: 'olahan-ikan', price: 4000, priceNote: 'per satuan', image: 'images/siomay-tenggiri.png' },
  { id: 'siomay-grade-b', name: 'Siomay Grade B', category: 'olahan-ikan', price: 2000, priceNote: 'per satuan', image: 'images/siomay-grade-b.png' },
  { id: 'otak-otak', name: 'Otak-otak', category: 'olahan-ikan', price: 2000, priceNote: 'per satuan', image: 'images/otak-otak.jpeg' },
  { id: 'kerupuk', name: 'Kerupuk', category: 'olahan-ikan', price: 16000, priceNote: 'Kemasan besar', image: 'images/kerupuk.jpeg' },

  // ---- Lauk Pauk ----
  { id: 'rendang', name: 'Rendang', category: 'lauk-pauk', price: 47000, image: 'images/rendang.jpg' },
  { id: 'sop-daging', name: 'Sop Daging', category: 'lauk-pauk', price: 47000 },
  { id: 'ayam-ungkep', name: 'Ayam Ungkep', category: 'lauk-pauk', price: 31000, image: 'images/ayam-ungkep.png' },
  { id: 'ayam-bakar', name: 'Ayam Bakar', category: 'lauk-pauk', price: 36000, image: 'images/ayam-bakar.png' },

  // ---- Ikan & Seafood ----
  {
    id: 'nila-bakar',
    name: 'Nila Bakar',
    category: 'ikan-seafood',
    variants: [
      { label: '1 Ikan', price: 18000 },
      { label: '4 Ikan + Sambal Terasi', price: 60000 },
    ],
    image: 'images/ikan-bakar.jpg',
  },
  { id: 'mas-bakar', name: 'Mas Bakar', category: 'ikan-seafood', price: null },
  { id: 'lele-bakar', name: 'Lele Bakar', category: 'ikan-seafood', price: null },
  { id: 'cumi-asin', name: 'Cumi Asin', category: 'ikan-seafood', price: 35000, priceNote: '250 gr' },
  { id: 'ikan-marinasi', name: 'Ikan Marinasi', category: 'ikan-seafood', price: null, image: 'images/ikan-marinasi.jpg' },

  // ---- Snack ----
  { id: 'beng-beng', name: 'Beng-beng', category: 'snack', price: 3000, image: 'images/beng-beng.jpg' },
  { id: 'saltcheese', name: 'Saltcheese', category: 'snack', price: 1500, image: 'images/saltcheese.jpg' },
  { id: 'better', name: 'Better', category: 'snack', price: 2500, image: 'images/better.png' },
  { id: 'sari-gandum', name: 'Sari Gandum', category: 'snack', price: 2500, image: 'images/sari-gandum.jpg' },
  { id: 'brownies-crispy', name: 'Brownies Crispy', category: 'snack', price: 2000, image: 'images/brownies-crispy.jpg' },
  { id: 'marie-regal', name: 'Marie Regal', category: 'snack', price: 1500, image: 'images/marie-regal.jpg' },

  // ---- Aneka Cemilan ----
  { id: 'kripik-sanjay', name: 'Kripik Sanjay Ante', category: 'aneka-cemilan', price: 13000, image: 'images/kripik-sanjay.png' },
  { id: 'stik-bawang', name: 'Stik Bawang', category: 'aneka-cemilan', price: 15000, image: 'images/stik-bawang.jpeg' },
  { id: 'marning', name: 'Marning', category: 'aneka-cemilan', price: 19000, image: 'images/marning.jpeg' },
  { id: 'rengginang', name: 'Rengginang', category: 'aneka-cemilan', price: 15000, image: 'images/rengginang.jpeg' },
  { id: 'bagelen', name: 'Bagelen', category: 'aneka-cemilan', price: 15000, image: 'images/bagelen.jpeg' },
  { id: 'kripik-usus', name: 'Kripik Usus', category: 'aneka-cemilan', price: 16000, image: 'images/kripik-usus.jpeg' },
  { id: 'basreng', name: 'Basreng', category: 'aneka-cemilan', price: 16000, image: 'images/basreng.jpeg' },
  { id: 'tahu-walik', name: 'Tahu Walik', category: 'aneka-cemilan', price: 16000, image: 'images/tahu-walik.jpeg' },
  { id: 'kripik-nangka', name: 'Kripik Nangka', category: 'aneka-cemilan', price: 16000, image: 'images/kripik-nangka.jpeg' },
  { id: 'muli', name: 'Muli', category: 'aneka-cemilan', price: 26000, image: 'images/muli.jpeg' },
  { id: 'grubi', name: 'Grubi', category: 'aneka-cemilan', price: 16000, image: 'images/grubi.jpeg' },
  { id: 'soes-coklat', name: 'Soes Coklat', category: 'aneka-cemilan', price: 39000, image: 'images/soes-coklat.jpeg' },
  { id: 'cemilan-26', name: 'Cemilan Spesial', category: 'aneka-cemilan', price: 26000, image: 'images/cemilan-26.jpg' },
  { id: 'cemilan-30', name: 'Cemilan Spesial Plus', category: 'aneka-cemilan', price: 30000 },

  // ---- Kebutuhan Rumah ----
  {
    id: 'sprei-kaos',
    name: 'Sprei Berbahan Kaos Premium',
    category: 'kebutuhan-rumah',
    price: null,
    externalUrl: 'https://sites.google.com/view/confetti-lampung/beranda',
    description: 'Menjual berbagai perlengkapan kamar tidur, produk utamanya adalah sprei berbahan kaos.',
    image: 'images/sprei-kaos.jpeg',
  },
]

export const getCategory = (slug) => categories.find((c) => c.slug === slug)
export const getProductsByCategory = (slug) => products.filter((p) => p.category === slug)
export const getProduct = (id) => products.find((p) => p.id === id)

export const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
