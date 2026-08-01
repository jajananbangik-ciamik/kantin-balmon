import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <p>
        <strong>KANTIN BALMON</strong> — Pertolongan Pertama Pada Kelaparan
      </p>
      <p>Self-service: ambil sendiri jajanannya, tunjukkan daftar belanja ke kasir.</p>
      <p>
        <Link to="/admin">Upload foto produk (admin)</Link>
      </p>
    </footer>
  )
}
