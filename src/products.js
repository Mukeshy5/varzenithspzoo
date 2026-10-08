import { metaA } from './productMetaA'
import { metaB } from './productMetaB'

const assetImages = import.meta.glob('./assets/*', { eager: true, query: '?url', import: 'default' })
const meta = { ...metaA, ...metaB }

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const products = Object.entries(assetImages).map(([path, url], index) => {
  const file = path.split('/').pop() || `product-${index}`
  const base = file.replace(/\.[^.]+$/, '')
  const key = base.toLowerCase()
  const m = meta[key] || { name: base, category: 'Everyday Essentials', price: 29, unit: '1 pc', rating: 4.5, description: 'Quality everyday grocery essential.' }
  return { id: slugify(base) || `product-${index}`, name: m.name, category: m.category, price: m.price, unit: m.unit, badge: m.badge, rating: m.rating || 4.5, description: m.description, image: url, featured: index < 8 }
}).sort((a, b) => a.name.localeCompare(b.name))
