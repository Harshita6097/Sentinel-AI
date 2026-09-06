import { useRef, useState } from 'react'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/tiff'

export default function ImageUploader({ onFile }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handle = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    onFile(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handle(e.dataTransfer.files[0])
  }

  return (
    <div
      style={{ ...s.zone, ...(dragging ? s.zoneDrag : {}) }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current.click()}
    >
      <input ref={inputRef} type="file" accept={ACCEPT} style={{ display: 'none' }}
        onChange={(e) => handle(e.target.files[0])} />
      <div style={s.icon}>🛰️</div>
      <div style={s.primary}>Drop satellite image here</div>
      <div style={s.secondary}>or click to browse · JPEG, PNG, WebP, TIFF · max 20 MB</div>
    </div>
  )
}

const s = {
  zone: {
    border: '2px dashed #374151', borderRadius: 12,
    padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer',
    background: '#111827', transition: 'border-color 0.15s, background 0.15s',
  },
  zoneDrag: { borderColor: '#3b82f6', background: '#0f172a' },
  icon: { fontSize: '2.5rem', marginBottom: '0.75rem' },
  primary: { color: '#e5e7eb', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.4rem' },
  secondary: { color: '#4b5563', fontSize: '0.78rem' },
}
