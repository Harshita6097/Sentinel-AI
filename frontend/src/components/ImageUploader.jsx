import { useState } from 'react'
import ImagePreview from './ImagePreview'

export default function ImageUploader({ onAnalyze, loading }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const handleFile = (f) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
  }

  return (
    <div style={s.wrap}>
      {!previewUrl
        ? <ImagePreview onFile={handleFile} />
        : (
          <div style={s.preview}>
            <img src={previewUrl} alt="preview" style={s.img} />
            <div style={s.meta}>
              <span style={s.filename}>{file.name}</span>
              <span style={s.size}>{(file.size / 1024).toFixed(0)} KB</span>
            </div>
            <div style={s.actions}>
              <button style={s.btnPrimary} onClick={() => onAnalyze(file)} disabled={loading}>
                {loading ? 'Analysing…' : '🔍 Analyse Image'}
              </button>
              <button style={s.btnSecondary} onClick={handleClear} disabled={loading}>
                ✕ Clear
              </button>
            </div>
          </div>
        )
      }
    </div>
  )
}

const s = {
  wrap: { width: '100%' },
  preview: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  img: { width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 8, border: '1px solid #1f2937' },
  meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  filename: { color: '#9ca3af', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' },
  size: { color: '#4b5563', fontSize: '0.72rem' },
  actions: { display: 'flex', gap: '0.5rem' },
  btnPrimary: {
    flex: 1, padding: '0.55rem', background: '#1d4ed8', border: 'none',
    borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
  },
  btnSecondary: {
    padding: '0.55rem 1rem', background: '#1f2937', border: '1px solid #374151',
    borderRadius: 8, color: '#9ca3af', fontSize: '0.85rem', cursor: 'pointer',
  },
}
