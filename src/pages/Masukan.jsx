import { useState } from 'react'
import { sendFeedback } from '../utils/sheets'

export default function Masukan() {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    setStatus(null)
    const res = await sendFeedback({ message: message.trim() })
    setSending(false)
    if (res.ok) {
      setStatus({ ok: true, text: 'Terima kasih! Masukanmu sudah terkirim.' })
      setMessage('')
    } else {
      const text =
        res.reason === 'not-configured'
          ? 'Form belum bisa dipakai karena Google Sheets belum dihubungkan.'
          : 'Gagal mengirim masukan. Coba lagi nanti.'
      setStatus({ ok: false, text })
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-head-title">Beri Masukan</h1>
        <p>
          Punya saran, kritik, atau request menu baru untuk Kantin Balmon? Tulis langsung di bawah
          ini —
          langsung masuk ke kami.
        </p>
      </div>

      <form className="masukan-form" onSubmit={submit}>
        <label>
          Pesan <small>(wajib)</small>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis masukanmu di sini..."
            rows={5}
            maxLength={1000}
            required
          />
        </label>

        {status && (
          <p className={`hint ${status.ok ? 'ok' : 'err'}`}>{status.text}</p>
        )}

        <div className="feat-actions">
          <button className="btn btn-primary" type="submit" disabled={sending || !message.trim()}>
            {sending ? 'Mengirim...' : 'Kirim Masukan'}
          </button>
        </div>
      </form>
    </div>
  )
}