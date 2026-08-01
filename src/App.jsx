import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { UploadsProvider } from './context/UploadsContext'
import { StockProvider } from './context/StockContext'
import { CatalogProvider } from './context/CatalogContext'
import { useStock } from './context/StockContext'
import { useCatalog } from './context/CatalogContext'
import Navbar from './components/Navbar'
import CartDrawer from './components/CartDrawer'
import Footer from './components/Footer'
import Home from './pages/Home'
import CategoryPage from './pages/CategoryPage'
import Checkout from './pages/Checkout'
import Admin from './pages/Admin'

function LoadingGate({ children }) {
  const catalog = useCatalog()
  const stock = useStock()
  const [forced, setForced] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setForced(true), 5000)
    return () => clearTimeout(t)
  }, [])

  if (!(catalog.loaded && stock.loaded) && !forced) {
    return (
      <div className="loading-screen">
        <span className="spinner" />
        <p>Memuat menu Kantin Balmon...</p>
      </div>
    )
  }
  return children
}

export default function App() {
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <UploadsProvider>
      <StockProvider>
        <CatalogProvider>
          <CartProvider>
            <LoadingGate>
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
            </LoadingGate>
          </CartProvider>
        </CatalogProvider>
      </StockProvider>
    </UploadsProvider>
  )
}
