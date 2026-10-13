import { Component, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { HashRouter, Link, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'

import { products } from './products'
const currencies = {
  PLN: { symbol: 'zł', rate: 1, locale: 'pl-PL' },
  USD: { symbol: '$', rate: 0.25, locale: 'en-US' },
  GBP: { symbol: '£', rate: 0.2, locale: 'en-GB' },
}

const plans = [
  { name: 'Basic', price: 299, text: 'A thoughtful starting point', features: ['Curated essentials', 'Reliable delivery', 'Email support'] },
  { name: 'Professional', price: 599, text: 'For a more complete experience', features: ['Priority selection', 'Flexible delivery', 'Dedicated support'], popular: true },
  { name: 'Business', price: 999, text: 'Made for growing needs', features: ['Bulk ordering', 'Personal assistance', 'Flexible invoicing'] },
]

const formatPrice = (price, currency) => {
  const config = currencies[currency] || currencies.GBP
  const safePrice = Number(price) || 0
  try {
    return `${config.symbol}${(safePrice * config.rate).toLocaleString(config.locale, { minimumFractionDigits: currency === 'PLN' ? 0 : 2, maximumFractionDigits: 2 })}`
  } catch {
    return `${config.symbol}${(safePrice * config.rate).toFixed(2)}`
  }
}

const safeRead = (key, fallback) => {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : value
  } catch {
    return fallback
  }
}

const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage blocked (private mode) — ignore so UI never crashes */
  }
}

const safeRemove = (key) => {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

const readCart = () => {
  try {
    const raw = localStorage.getItem('varzenith-cart')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => item && typeof item.id === 'string' && Number.isFinite(Number(item.quantity)))
  } catch {
    try {
      localStorage.removeItem('varzenith-cart')
    } catch {
      /* ignore */
    }
    return []
  }
}

const HERO_HEADLINES = ['Reliable service.', 'Everyday essentials.', 'Fresh choices.', 'Easy shopping.']

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    const handleNavigation = (event) => {
      const link = event.target.closest?.('a[href]')
      if (link && link.origin === window.location.origin) window.scrollTo(0, 0)
    }
    document.addEventListener('click', handleNavigation, true)
    return () => document.removeEventListener('click', handleNavigation, true)
  }, [])

  useLayoutEffect(() => {
    const root = document.documentElement
    const previousScrollBehavior = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'
    window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    root.style.scrollBehavior = previousScrollBehavior
    const resetTimer = window.setTimeout(() => window.scrollTo(0, 0), 0)
    return () => window.clearTimeout(resetTimer)
  }, [pathname])

  return null
}

const Icon = ({ name, size = 20 }) => {
  const paths = {
    bag: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.8L6.6 20l1-6.1L3.2 9.5l6.1-.9L12 3z" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    code: <><path d="m8 9-4 3 4 3" /><path d="m16 9 4 3-4 3" /><path d="m14 5-4 14" /></>,
    mobile: <><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></>,
    building: <><path d="M4 21V5l8-3 8 3v16" /><path d="M8 8h1M15 8h1M8 12h1M15 12h1M8 16h1M15 16h1M11 21v-4h2v4" /></>,
    database: <><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5" /><path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" /></>,
    wrench: <><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17a2 2 0 0 0 3 3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.8-2.8 2.2-2.6Z" /></>,
    message: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.2 8.2 0 0 1-3.2-.7L4 20l1.7-3.8A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Header({ currency, setCurrency, cartCount }) {
  const [open, setOpen] = useState(false)
  return <header className="site-header">
    <div className="header-inner">
      <Link to="/" className="brand" onClick={() => setOpen(false)}><span className="brand-mark">V</span><span>VARZENITH</span></Link>
      <nav className={open ? 'main-nav is-open' : 'main-nav'}>
        <Link to="/" onClick={() => setOpen(false)}>Home</Link><Link to="/about" onClick={() => setOpen(false)}>About us</Link><Link to="/products" onClick={() => setOpen(false)}>Shop</Link><Link to="/contact" onClick={() => setOpen(false)}>Contact</Link>
      </nav>
      <div className="header-actions">
        <label className="currency"><span className="sr-only">Currency</span><select value={currency} onChange={(e) => setCurrency(e.target.value)}><option value="PLN">PLN zł</option><option value="USD">USD $</option><option value="GBP">GBP £</option></select></label>
        <Link to="/cart" className="cart-button" aria-label="Shopping cart"><Icon name="bag" size={21} /><span>{cartCount}</span></Link>
        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu"><Icon name={open ? 'close' : 'menu'} /></button>
      </div>
    </div>
  </header>
}

function Footer() {
  return <footer className="footer"><div className="footer-grid"><div><Link to="/" className="brand footer-brand"><span className="brand-mark">V</span><span>VARZENITH</span></Link><p>Quality products and reliable service.</p></div><div><h4>Explore</h4><Link to="/products">Shop</Link><Link to="/about">About us</Link><Link to="/contact">Contact</Link><Link to="/developer" className="footer-developer-link">Developer <span>↗</span></Link></div><div><h4>Support</h4><Link to="/privacy">Privacy policy</Link><Link to="/terms">Terms of service</Link><Link to="/cart">Your cart</Link></div><div><h4>Stay connected</h4><p>New arrivals, considered living and more.</p><div className="socials"><a href="#instagram">Instagram</a><a href="#linkedin">LinkedIn</a></div></div></div><div className="footer-bottom"><span>© 2026 Varzenith. All rights reserved.</span><span>Made for everyday living.</span></div></footer>
}

function Button({ to, children, light = false, onClick }) {
  const className = light ? 'button button-light' : 'button button-dark'
  return to ? <Link to={to} className={className}>{children}<Icon name="arrow" size={17} /></Link> : <button className={className} onClick={onClick}>{children}<Icon name="arrow" size={17} /></button>
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  handleRetry = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return <section className="section not-found"><p className="eyebrow">Something went wrong</p><h1>Please <em>try again.</em></h1><p className="legal-intro">The page hit a temporary issue. Your cart is safe — just retry.</p><div className="hero-actions" style={{ justifyContent: 'center' }}><button className="button button-dark" onClick={this.handleRetry}>Retry</button><Link to="/" className="button button-light" onClick={() => this.setState({ hasError: false })}>Back to home</Link></div></section>
    }
    return this.props.children
  }
}

function ProductCard({ product, currency, onAdd }) {
  const [added, setAdded] = useState(false)
  const handleAdd = () => { onAdd(product); setAdded(true); setTimeout(() => setAdded(false), 1200) }
  return <article className="product-card"><Link to={`/products/${product.id}`} className="product-image"><img src={product.image} alt={product.name} loading="lazy" />{product.badge && <span className="card-badge">{product.badge}</span>}<span className="image-arrow"><Icon name="arrow" size={16} /></span></Link><div className="product-card-body"><div><div className="card-top"><p className="product-category">{product.category}</p><span className="card-rating"><Icon name="star" size={12} />{product.rating}</span></div><h3><Link to={`/products/${product.id}`}>{product.name}</Link></h3><p className="card-desc">{product.description}</p><p className="card-unit">{product.unit}</p></div><div className="product-card-footer"><strong>{formatPrice(product.price, currency)}</strong><button className={added ? 'add-btn added' : 'add-btn'} onClick={handleAdd}>{added ? 'Added ✓' : 'Add + '}</button></div></div></article>
}

function Home({ currency, onAdd }) {
  const [heroIndex, setHeroIndex] = useState(0)
  const [headlineIndex, setHeadlineIndex] = useState(0)
  const [headlineText, setHeadlineText] = useState('')
  const [isDeletingHeadline, setIsDeletingHeadline] = useState(false)
  const heroImages = products.slice(0, 5)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroImages.length)
    }, 4500)
    return () => window.clearInterval(timer)
  }, [heroImages.length])

  useEffect(() => {
    const target = HERO_HEADLINES[headlineIndex]
    const isComplete = headlineText === target
    const isEmpty = headlineText.length === 0
    const delay = isComplete && !isDeletingHeadline ? 1700 : isEmpty && isDeletingHeadline ? 350 : isDeletingHeadline ? 55 : 105

    const timer = window.setTimeout(() => {
      if (isComplete && !isDeletingHeadline) {
        setIsDeletingHeadline(true)
      } else if (isEmpty && isDeletingHeadline) {
        setHeadlineIndex((current) => (current + 1) % HERO_HEADLINES.length)
        setIsDeletingHeadline(false)
      } else {
        const nextLength = headlineText.length + (isDeletingHeadline ? -1 : 1)
        setHeadlineText(target.slice(0, nextLength))
      }
    }, delay)

    return () => window.clearTimeout(timer)
  }, [headlineIndex, headlineText, isDeletingHeadline])

  const heroProduct = heroImages[heroIndex]
  return <><section className="hero"><div className="hero-copy"><p className="eyebrow">A considered collection</p><h1>Quality products.<br /><em aria-live="polite">{headlineText}<span className="typing-cursor" aria-hidden="true">|</span></em><br />Easy shopping.</h1><p className="hero-lede">Discover carefully selected products from Varzenith and enjoy a simple, secure and convenient shopping experience.</p><div className="hero-actions"><Button to="/products">Shop now</Button><Button to="/about" light>Learn more</Button></div></div><div className="hero-visual"><img key={heroProduct.id} src={heroProduct.image} alt={heroProduct.name} /><div className="hero-note"><span>0{heroIndex + 1} / 05</span><p>{heroProduct.name}<br />for everyday rituals</p></div><div className="hero-dots">{heroImages.map((item, index) => <button key={item.id} className={index === heroIndex ? 'active' : ''} onClick={() => setHeroIndex(index)} aria-label={`Show hero image ${index + 1}`} />)}</div></div></section><section className="section section-benefits"><div className="section-heading"><p className="eyebrow">The Varzenith difference</p><h2>Made to feel <em>just right.</em></h2></div><div className="benefit-grid">{[['01', 'Quality products', 'Thoughtfully selected goods that bring lasting value to daily life.'], ['02', 'Reliable service', 'Clear communication, careful packing and dependable delivery.'], ['03', 'Secure shopping', 'A straightforward experience designed with your peace of mind in mind.'], ['04', 'Customer satisfaction', 'Personal, responsive support whenever you need a hand.']].map(([number, title, text]) => <div className="benefit" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></div>)}</div></section><section className="section featured-section"><div className="section-heading heading-row"><div><p className="eyebrow">A few favourites</p><h2>Featured <em>products.</em></h2></div><Button to="/products" light>View all products</Button></div><div className="product-grid">{products.filter((p) => p.featured).slice(0, 8).map((product) => <ProductCard key={product.id} product={product} currency={currency} onAdd={onAdd} />)}</div></section><section className="split-banner"><div><p className="eyebrow">About Varzenith</p><h2>Useful things,<br /><em>beautifully chosen.</em></h2><p>We believe shopping should be clear, calm and enjoyable. Our collection brings together quality pieces with a service that puts people first.</p><Button to="/about">Our story</Button></div><img src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1200&q=85" alt="Minimal room with a wooden table and chair" /></section><section className="section plans-section"><div className="section-heading"><p className="eyebrow">Simple options</p><h2>Choose your <em>plan.</em></h2></div><div className="plans-grid">{plans.map((plan) => <div className={plan.popular ? 'plan-card popular' : 'plan-card'} key={plan.name}>{plan.popular && <span className="popular-label">Most chosen</span>}<p className="eyebrow">{plan.name}</p><h3>{formatPrice(plan.price, currency)} <small>/ month</small></h3><p>{plan.text}</p><ul>{plan.features.map((feature) => <li key={feature}><Icon name="check" size={16} />{feature}</li>)}</ul><Button to="/contact" light>Get started</Button></div>)}</div></section><section className="cta-section"><p className="eyebrow">Your next favourite is waiting</p><h2>Ready to explore?</h2><Button to="/products">Start shopping</Button></section></>
}

function About() {
  return <><section className="page-hero"><p className="eyebrow">Who we are</p><h1>Good products.<br /><em>A better experience.</em></h1><p>Varzenith is a modern Polish company focused on providing quality products and a convenient shopping experience for customers.</p></section><section className="section about-intro"><img src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=85" alt="Bright modern workspace" /><div><p className="eyebrow">Our approach</p><h2>Thoughtful from<br /><em>the very start.</em></h2><p>Our goal is to combine reliable service, carefully selected products and a simple digital shopping experience. Every detail is considered to make choosing, ordering and receiving your products feel effortless.</p><p>We are building a brand based on quality, reliability, transparency, customer focus and professional service.</p></div></section><section className="section values-section"><div className="section-heading"><p className="eyebrow">What guides us</p><h2>Our <em>values.</em></h2></div><div className="values-grid">{['Quality', 'Reliability', 'Transparency', 'Customer focus', 'Professional service'].map((value, i) => <div key={value}><span>0{i + 1}</span><h3>{value}</h3><p>Clear choices and care in everything we do.</p></div>)}</div></section></>
}

function Products({ currency, onAdd }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('Featured')
  const categories = ['All', ...new Set(products.map((p) => p.category))]
  const filtered = useMemo(() => products.filter((p) => (category === 'All' || p.category === category) && `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'Price: Low to High' ? a.price - b.price : sort === 'Price: High to Low' ? b.price - a.price : sort === 'Name A-Z' ? a.name.localeCompare(b.name) : 0), [query, category, sort])
  const heroImg = (products.find((p) => p.badge === 'Bestseller') || products[0])?.image
  return <><section className="shop-hero-new"><div className="shop-hero-bg" style={heroImg ? { backgroundImage: `url(${heroImg})` } : {}} /><div className="shop-hero-overlay" /><div className="shop-hero-content"><p className="eyebrow light">The collection — {products.length} products</p><h1>Fresh groceries,<br /><em>delivered fast.</em></h1><p>All your everyday essentials — dairy, fresh produce, pantry, beverages and snacks — in one stylish shop.</p><div className="hero-stats"><div><strong>{products.length}</strong><span>Products</span></div><div><strong>{categories.length - 1}</strong><span>Categories</span></div><div><strong>4.7 ★</strong><span>Avg rating</span></div></div></div></section><section className="section shop-section"><div className="cat-pills">{categories.map((item) => <button key={item} className={category === item ? 'cat-pill active' : 'cat-pill'} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="shop-toolbar"><label className="search-box"><Icon name="search" size={18} /><input placeholder="Search rice, milk, tea..." value={query} onChange={(e) => setQuery(e.target.value)} />{query && <button className="clear-search" onClick={() => setQuery('')}>✕</button>}</label><div className="filter-actions"><span className="result-count">{filtered.length} items</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option>Featured</option><option>Price: Low to High</option><option>Price: High to Low</option><option>Name A-Z</option></select></div></div>{filtered.length ? <div className="product-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} currency={currency} onAdd={onAdd} />)}</div> : <div className="empty-state"><h2>No products found.</h2><p>Try a different search or category.</p><button className="button button-dark" onClick={() => { setQuery(''); setCategory('All') }}>Show all</button></div>}</section></>
}

function ProductDetails({ currency, onAdd }) {
  const { id } = useParams()
  const product = products.find((item) => item.id === id) || products[0]
  const [quantity, setQuantity] = useState(1)
  const add = () => { for (let i = 0; i < quantity; i += 1) onAdd(product) }
  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4)
  return <><section className="section product-details"><div className="details-image"><img src={product.image} alt={product.name} />{product.badge && <span className="card-badge">{product.badge}</span>}</div><div className="details-copy"><p className="eyebrow">{product.category} · {product.unit}</p><h1>{product.name}</h1><p className="details-rating"><span className="card-rating"><Icon name="star" size={13} />{product.rating}</span> · 120+ happy buyers</p><p className="details-price">{formatPrice(product.price, currency)} <small>/ {product.unit}</small></p><p className="details-description">{product.description} Carefully chosen materials and a timeless form make this an easy addition to everyday life.</p><p className="availability"><span /> In stock · ships in 2–4 days</p><div className="purchase-row"><div className="quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Icon name="minus" size={15} /></button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)}><Icon name="plus" size={15} /></button></div><button className="button button-dark" onClick={add}>Add to cart <Icon name="bag" size={17} /></button></div><div className="detail-notes"><details open><summary>Product description</summary><p>Designed for daily use, with quality and simplicity at its centre.</p></details><details><summary>Shipping information</summary><p>Shipping costs are calculated at checkout. We pack every order with care.</p></details><details><summary>Returns information</summary><p>Contact us within 14 days of delivery if you need help with a return.</p></details></div></div></section>{related.length > 0 && <section className="section related-section"><div className="section-heading heading-row"><div><p className="eyebrow">You may also like</p><h2>Related <em>products.</em></h2></div><Button to="/products" light>View all</Button></div><div className="product-grid">{related.map((item) => <ProductCard key={item.id} product={item} currency={currency} onAdd={onAdd} />)}</div></section>}</>
}

function Cart({ items, currency, changeQuantity, remove }) {
  const navigate = useNavigate()
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = items.length ? 25 : 0
  return <section className="section cart-page"><div className="page-title-row"><div><p className="eyebrow">Your selection</p><h1>Shopping <em>cart.</em></h1></div><span>{items.reduce((sum, item) => sum + item.quantity, 0)} items</span></div>{items.length ? <div className="cart-layout"><div className="cart-items">{items.map((item) => <div className="cart-item" key={item.id}><img src={item.image} alt="" /><div className="cart-item-info"><h3>{item.name}</h3><p>{formatPrice(item.price, currency)}</p><div className="quantity"><button onClick={() => changeQuantity(item.id, -1)}><Icon name="minus" size={15} /></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)}><Icon name="plus" size={15} /></button></div></div><button className="remove-button" onClick={() => remove(item.id)}>Remove</button></div>)}</div><aside className="order-summary"><p className="eyebrow">Summary</p><h2>Your order</h2><div><span>Subtotal</span><strong>{formatPrice(subtotal, currency)}</strong></div><div><span>Shipping</span><strong>{formatPrice(shipping, currency)}</strong></div><div className="summary-total"><span>Total</span><strong>{formatPrice(subtotal + shipping, currency)}</strong></div><Button to="/checkout">Proceed to checkout</Button><button className="continue-button" onClick={() => navigate('/products')}>Continue shopping</button></aside></div> : <div className="empty-state cart-empty"><h2>Your cart is empty.</h2><p>Find something useful for your everyday.</p><Button to="/products">Continue shopping</Button></div>}</section>
}

function Contact() {
  const [sent, setSent] = useState(false)
  return <><section className="page-hero contact-hero"><p className="eyebrow">We’re here to help</p><h1>Get in <em>touch.</em></h1><p>Have a question about our products or your order? Our team is here to help.</p></section><section className="section contact-layout"><div className="contact-info"><p className="eyebrow">Contact details</p><h2>Let’s start<br /><em>a conversation.</em></h2><div className="contact-detail"><span>Email</span><a href="mailto:contact@varzenithspzoo.com">contact@varzenithspzoo.com</a></div><div className="contact-detail"><span>Phone</span><a href="tel:+48123456789">+48 123 456 789</a></div><div className="contact-detail"><span>Based in</span><p>Poznań, Wielkopolskie<br />Poland</p></div></div><form className="contact-form" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>{sent ? <div className="form-success"><span>✓</span><h3>Thank you for reaching out.</h3><p>We’ll get back to you as soon as possible.</p></div> : <><label>Full name<input required placeholder="Your name" /></label><label>Email<input required type="email" placeholder="you@example.com" /></label><label>Subject<input required placeholder="How can we help?" /></label><label>Message<textarea required rows="5" placeholder="Write your message..." /></label><button className="button button-dark" type="submit">Send message <Icon name="arrow" size={17} /></button></>}</form></section><section className="section contact-map-section"><div className="contact-map-heading"><div><p className="eyebrow">Find us</p><h2>Visit us in <em>Poznań.</em></h2></div><a className="text-button map-link" href="https://www.google.com/maps/search/?api=1&query=Poznan%2C%20Poland" target="_blank" rel="noreferrer">Open in Google Maps <span>↗</span></a></div><div className="contact-map"><iframe title="Map showing Poznań, Poland" src="https://www.google.com/maps?q=Poznan%2C%20Poland&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div></section></>
}

const developerServices = [
  ['code', 'Website Development', 'Business, company, portfolio, landing page, and custom websites.'],
  ['code', 'Web Application Development', 'Dynamic web applications, admin dashboards, and management systems.'],
  ['mobile', 'Mobile App Development', 'Customized mobile applications shaped around project requirements.'],
  ['building', 'Hospital Management Software', 'Hospital panels, patient registration, billing, and staff management modules.'],
  ['building', 'School & Coaching Websites', 'Professional education websites with enquiries, courses, and contact forms.'],
  ['wrench', 'Custom Software Development', 'Tailor-made software based on your business workflow and requirements.'],
  ['wrench', 'Website Redesign & Maintenance', 'Improvements, bug fixes, performance optimization, and ongoing maintenance.'],
  ['database', 'API & Database Integration', 'Secure backend development, API integration, and reliable database connectivity.'],
]

const developerBenefits = [
  'Fast and timely project delivery.',
  'Fully customized solutions according to client requirements.',
  'Modern, responsive, mobile-friendly designs.',
  'User-friendly interfaces and smooth navigation.',
  'Scalable frontend and backend architecture.',
  'Database integration and reliable data management.',
  'Performance optimization and bug fixing.',
  'Clear communication and project requirement discussions.',
  'Post-delivery support and maintenance options.',
  "Solutions designed around the client's budget and business goals.",
]

function DeveloperProfile() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Developed By Mr. Mukesh Yadav | Software, App & Website Developer'
    return () => { document.title = previousTitle }
  }, [])

  const whatsappUrl = 'https://wa.me/918052344204?text=Hello%20Mukesh%20Yadav%2C%20I%20want%20to%20discuss%20a%20website%2C%20mobile%20app%2C%20or%20custom%20software%20development%20project.'
  return <div className="developer-page">
    <section className="developer-hero">
      <div className="developer-hero-copy">
        <p className="eyebrow">Developed by</p>
        <h1>Mr. Mukesh <em>Yadav.</em></h1>
        <p className="developer-title">Software Developer <span>·</span> App Developer <span>·</span> Website Developer</p>
        <p className="developer-lede">Modern, professional, and user-friendly digital solutions built around the way your business works.</p>
        <div className="hero-actions"><a className="button button-dark" href={whatsappUrl} target="_blank" rel="noreferrer">Contact on WhatsApp <Icon name="message" size={17} /></a><a className="button button-light" href="mailto:my8052344204@gmail.com?subject=Project%20Development%20Enquiry">Send an Email <Icon name="arrow" size={17} /></a></div>
      </div>
      <div className="developer-hero-card"><span className="developer-monogram">MY</span><p>Building dependable digital experiences for businesses, startups, hospitals, schools, and organizations.</p><a href="tel:+918052344204">+91 8052344204</a></div>
    </section>
    <section className="section developer-about"><div><p className="eyebrow">About me</p><h2>Technology that<br /><em>serves your goals.</em></h2></div><div className="developer-about-copy"><p>I am a Software Developer, App Developer, and Website Developer focused on creating modern, professional, responsive, and user-friendly digital solutions for businesses, startups, hospitals, schools, coaching institutes, and other organizations.</p><p>I develop customized software and websites according to each client's business requirements, helping businesses improve their online presence, streamline their workflows, and manage their operations efficiently.</p><div className="developer-contact-row"><a href="mailto:my8052344204@gmail.com">my8052344204@gmail.com</a><a href="tel:+918052344204">+91 8052344204</a></div></div></section>
    <section className="section developer-services"><div className="section-heading"><p className="eyebrow">What I offer</p><h2>Services for your<br /><em>next project.</em></h2></div><div className="developer-service-grid">{developerServices.map(([icon, title, description]) => <article className="developer-service-card" key={title}><span className="developer-service-icon"><Icon name={icon} size={24} /></span><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <section className="section developer-benefits"><div className="section-heading"><p className="eyebrow">Why choose me?</p><h2>A practical, thoughtful<br /><em>partnership.</em></h2></div><div className="developer-benefit-grid">{developerBenefits.map((benefit, index) => <div className="developer-benefit" key={benefit}><span>0{index + 1}</span><p>{benefit}</p></div>)}</div></section>
    <section className="developer-cta"><p className="eyebrow">Let's build together</p><h2>Have a Project <em>in Mind?</em></h2><p>Looking for a professional website, mobile application, or customized software for your business? Let's discuss your requirements and build a solution that fits your needs.</p><div className="hero-actions"><a className="button button-dark" href="#developer-contact">Discuss Your Project <Icon name="arrow" size={17} /></a><a className="button button-light" href={whatsappUrl} target="_blank" rel="noreferrer">Contact on WhatsApp</a><a className="button button-light" href="mailto:my8052344204@gmail.com?subject=Project%20Development%20Enquiry">Send an Email</a></div></section>
    <div id="developer-contact" className="developer-contact-strip"><span>Available for thoughtful digital projects.</span><a href="mailto:my8052344204@gmail.com">my8052344204@gmail.com</a><a href="tel:+918052344204">Call +91 8052344204</a></div>
  </div>
}

function Checkout({ items, currency, clearCart }) {
  const [placed, setPlaced] = useState(false)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  if (placed) return <section className="section success-page"><span className="success-icon">✓</span><p className="eyebrow">Thank you</p><h1>Order successfully<br /><em>placed.</em></h1><p>Your order has been received successfully. We’ll be in touch with the next steps.</p><Button to="/products">Continue shopping</Button></section>
  return <section className="section checkout-page"><div><p className="eyebrow">Almost there</p><h1>Secure <em>checkout.</em></h1><form className="checkout-form" onSubmit={(e) => { e.preventDefault(); clearCart(); setPlaced(true) }}><div className="form-grid"><label>First name<input required /></label><label>Last name<input required /></label></div><label>Email<input required type="email" /></label><label>Address<input required /></label><div className="form-grid"><label>City<input required /></label><label>Postal code<input required /></label></div><label>Payment method<div className="payment-placeholder">Payment gateway integration will be connected here.</div></label><button className="button button-dark" type="submit">Place order <Icon name="arrow" size={17} /></button></form></div><aside className="order-summary"><p className="eyebrow">Summary</p><h2>Your order</h2>{items.map((item) => <div key={item.id}><span>{item.name} × {item.quantity}</span><strong>{formatPrice(item.price * item.quantity, currency)}</strong></div>)}<div><span>Shipping</span><strong>{formatPrice(25, currency)}</strong></div><div className="summary-total"><span>Total</span><strong>{formatPrice(subtotal + 25, currency)}</strong></div><p className="secure-note">✓ Your details are handled with care.</p></aside></section>
}

function Legal({ terms = false }) {
  const title = terms ? 'Terms of service' : 'Privacy policy'
  const sections = terms ? ['Introduction', 'Website usage', 'Products and services', 'Product information', 'Prices and currency', 'Orders and payments', 'Shipping, returns and refunds', 'User responsibilities', 'Intellectual property', 'Changes to terms', 'Contact information'] : ['Introduction', 'Information we collect', 'How we use information', 'Cookies and analytics', 'Order and payment information', 'Data security', 'Third-party services', 'Your rights', 'Data retention', 'Contact and policy updates']
  return <section className="section legal-page"><p className="eyebrow">Good to know</p><h1>{title.split(' ')[0]} <em>{title.split(' ').slice(1).join(' ')}</em></h1><p className="legal-intro">Last updated: October 2026</p><div className="legal-body">{sections.map((heading) => <div key={heading}><h2>{heading}</h2><p>We aim to communicate clearly and handle information responsibly. This section explains our approach in plain language and applies to the Varzenith website and services.</p></div>)}</div></section>
}

function App() {
  const [currency, setCurrencyState] = useState(() => {
    const saved = safeRead('varzenith-currency', 'GBP')
    return currencies[saved] ? saved : 'GBP'
  })
  const [items, setItems] = useState(() => readCart())
  const setCurrency = (value) => { setCurrencyState(value); safeWrite('varzenith-currency', value) }
  const onAdd = (product) => setItems((current) => { const found = current.find((item) => item.id === product.id); const next = found ? current.map((item) => item.id === product.id ? { ...item, quantity: (Number(item.quantity) || 0) + 1 } : item) : [...current, { ...product, quantity: 1 }]; try { safeWrite('varzenith-cart', JSON.stringify(next)) } catch { /* ignore */ } return next })
  const changeQuantity = (id, amount) => setItems((current) => { const next = current.map((item) => item.id === id ? { ...item, quantity: (Number(item.quantity) || 0) + amount } : item).filter((item) => Number(item.quantity) > 0); try { safeWrite('varzenith-cart', JSON.stringify(next)) } catch { /* ignore */ } return next })
  const remove = (id) => changeQuantity(id, -999)
  const clearCart = () => { setItems([]); safeRemove('varzenith-cart') }
  const cartCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
  return <HashRouter><ErrorBoundary><ScrollToTop /><Header currency={currency} setCurrency={setCurrency} cartCount={cartCount} /><main><Routes><Route path="/" element={<Home currency={currency} onAdd={onAdd} />} /><Route path="/about" element={<About />} /><Route path="/products" element={<Products currency={currency} onAdd={onAdd} />} /><Route path="/products/:id" element={<ProductDetails currency={currency} onAdd={onAdd} />} /><Route path="/cart" element={<Cart items={items} currency={currency} changeQuantity={changeQuantity} remove={remove} />} /><Route path="/checkout" element={<Checkout items={items} currency={currency} clearCart={clearCart} />} /><Route path="/contact" element={<Contact />} /><Route path="/developer" element={<DeveloperProfile />} /><Route path="/privacy" element={<Legal />} /><Route path="/terms" element={<Legal terms />} /><Route path="*" element={<section className="section not-found"><p className="eyebrow">404</p><h1>That page took<br /><em>a wrong turn.</em></h1><Button to="/">Back to home</Button></section>} /></Routes></main><Footer /></ErrorBoundary></HashRouter>
}

export default App
