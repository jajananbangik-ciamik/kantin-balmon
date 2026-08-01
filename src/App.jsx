import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { UploadsProvider } from './context/UploadsContext'
import Navbar from './components/Navbar'
import CartDrawer from './components/CartDrawer'
import Footer from './components/Footer'
import Home from './pages/Home'
import CategoryPage from './pages/CategoryPage'
import Checkout from './pages/Checkout'
import Admin from './pages/Admin'

export default function App() {
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <UploadsProvider>
      <CartProvider>
        <Navbar onCartOpen={() => setCartOpen(true)} />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/kategori/:slug" element={<CategoryPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      </CartProvider>
    </UploadsProvider>
  )
}
