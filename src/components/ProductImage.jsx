import { useState } from 'react'
import { imageSources } from '../data/imageSources'
import { useUploads } from '../context/UploadsContext'

export default function ProductImage({ product, alt }) {
  const { uploads } = useUploads()
  const [stage, setStage] = useState(product.image ? 0 : 1)
  const remote = imageSources[product.id]
  const override = uploads[product.id]

  if (override) {
    return <img src={override} alt={alt} loading="lazy" />
  }

  if (stage === 2) {
    return (
      <div className="ph-placeholder" aria-label={alt}>
        <span>{alt.slice(0, 2).toUpperCase()}</span>
      </div>
    )
  }

  const src = stage === 0 ? product.image : remote
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (stage === 0 && remote) setStage(1)
        else setStage(2)
      }}
    />
  )
}
