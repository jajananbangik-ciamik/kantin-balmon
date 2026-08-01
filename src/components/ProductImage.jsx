import { useState } from 'react'
import { imageSources } from '../data/imageSources'
import { useUploads } from '../context/UploadsContext'

const ID_EXTS = ['png', 'jpg', 'jpeg', 'webp']

export default function ProductImage({ product, alt }) {
  const { uploads } = useUploads()
  const [stage, setStage] = useState(0)
  const remote = imageSources[product.id]
  const override = uploads[product.id]

  if (override) {
    return <img src={override} alt={alt} loading="lazy" />
  }

  const candidates = []
  if (product.image) candidates.push(product.image)
  ID_EXTS.forEach((ext) => candidates.push(`images/${product.id}.${ext}`))
  if (remote) candidates.push(remote)

  if (stage >= candidates.length) {
    return (
      <div className="ph-placeholder" aria-label={alt}>
        <span>{alt.slice(0, 2).toUpperCase()}</span>
      </div>
    )
  }

  return (
    <img
      src={candidates[stage]}
      alt={alt}
      loading="lazy"
      onError={() => setStage((s) => s + 1)}
    />
  )
}
