import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { categories } from '../data/products'
import { useCart } from '../context/CartContext'

export default function Navbar({ onCartOpen }) {
  const { itemCount } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="navbar-top">
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-logo">KB</span>
          <span className="brand-text">
            <strong>KANTIN BALMON</strong>
            <small>Pertolongan Pertama Pada Kelaparan</small>
          </span>
        </Link>
        <button className="btn btn-primary cart-btn" onClick={onCartOpen}>
          Keranjang {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
        </button>
        <button
          className="nav-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Buka menu"
        >
          ☰
        </button>
      </div>
      <nav className={`nav-links${menuOpen ? ' open' : ''}`}>
        <NavLink to="/" end onClick={() => setMenuOpen(false)}>
          Home
        </NavLink>
        {categories.map((c) => (
          <NavLink key={c.slug} to={`/kategori/${c.slug}`} onClick={() => setMenuOpen(false)}>
            {c.name}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
