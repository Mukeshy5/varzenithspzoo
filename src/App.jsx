import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Cart from './components/Cart.jsx'
import Home from './components/Home.jsx'
import ProductsPage from './pages/ProductsPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import PricingPage from './pages/PricingPage.jsx'
import Quote from './pages/Quote.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import { currencies } from './common/currency.js'

const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [pathname])

  return null
}

const App = () => {
  const [cartItems, setCartItems] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [currency, setCurrency] = useState('USD')
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  const addToCart = (product) => {
    setCartItems((items) => {
      const existingItem = items.find((item) => item.name === product.name)
      if (existingItem) {
        return items.map((item) => item.name === product.name
          ? { ...item, quantity: item.quantity + 1 }
          : item)
      }
      return [...items, { ...product, quantity: 1 }]
    })
  }

  const changeQuantity = (productName, change) => {
    setCartItems((items) => items
      .map((item) => item.name === productName
        ? { ...item, quantity: item.quantity + change }
        : item)
      .filter((item) => item.quantity > 0))
  }

  const removeFromCart = (productName) => {
    setCartItems((items) => items.filter((item) => item.name !== productName))
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar
        cartCount={cartCount}
        currency={currency}
        currencies={currencies}
        onCurrencyChange={setCurrency}
        onCartOpen={() => setCartOpen(true)}
      />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductsPage currency={currency} onAddToCart={addToCart} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/pricing" element={<PricingPage currency={currency} />} />
          <Route path="/quote" element={<Quote onCartOpen={() => setCartOpen(true)} />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="*" element={<section className="not-found section-pad"><p className="eyebrow">PAGE NOT FOUND</p><h1>Let's get you <em>back on track.</em></h1><Link className="button button-dark" to="/">Back to home <span aria-hidden="true">↗</span></Link></section>} />
        </Routes>
      </main>
      <Footer />
      <Cart
        items={cartItems}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onChangeQuantity={changeQuantity}
        onRemove={removeFromCart}
        currency={currency}
      />
    </BrowserRouter>
  )
}

export default App