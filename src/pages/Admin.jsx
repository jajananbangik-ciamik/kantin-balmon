import { useRef, useState } from 'react'
import { categories, products } from '../data/products'
import { useUploads, resizeImageFile } from '../context/UploadsContext'
import ProductImage from '../components/ProductImage'

export default function Admin() {
  const { uploads, setUpload, removeUpload } = useUploads()
  const [busyId, setBusyId] = useState(null)
  const fileRef = useRef(null)

  const onPick = async (product, file) => {
    if (!file) return
    setBusyId(product.id)
    try {
      const dataUrl = await resizeImageFile(file)
      setUpload(product.id, dataUrl)
    } catch (err) {
      alert('Gagal memproses gambar: ' + err.message)
    } finally {
      setBusyId(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-head-title">Upload Foto Produk</h1>
        <p>Unggah foto untuk mengganti tampilan produk. Foto tersimpan di perangkat ini.</p>
      </div>

      {categories.map((cat) => {
        const items = products.filter((p) => p.category === cat.slug)
        if (!items.length) return null
        return (
          <section key={cat.slug} className="section">
            <h2 className="section-title">{cat.name}</h2>
            <div className="admin-grid">
              {items.map((product) => (
                <div key={product.id} className="admin-card">
                  <div className="admin-thumb">
                    <ProductImage product={product} alt={product.name} />
                  </div>
                  <p className="admin-name">{product.name}</p>
                  <label className="btn btn-outline btn-block">
                    {busyId === product.id ? 'Memproses...' : 'Pilih Foto'}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={busyId === product.id}
                      onChange={(e) => onPick(product, e.target.files?.[0])}
                    />
                  </label>
                  {uploads[product.id] && (
                    <button
                      className="btn btn-block"
                      style={{ background: '#fff1f2', color: '#e03131', border: '1px solid #ffc9c9' }}
                      onClick={() => removeUpload(product.id)}
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
