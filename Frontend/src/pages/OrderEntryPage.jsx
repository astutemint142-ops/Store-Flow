import { useEffect, useState } from 'react'
import { ShoppingCart, Minus, Plus, X, Search } from 'lucide-react'
import { apiFetch } from '../api'
import { formatCurrency } from '../currency'

export default function OrderEntryPage() {
  const [items, setItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState({})
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function loadData() {
    setLoading(true)
    apiFetch('/items')
      .then(setItems)
      .catch(() => setError('Failed to load catalog.'))
      .finally(() => setLoading(false))
  }

  useEffect(loadData, [])

  const query = searchQuery.trim().toLowerCase()
  const visibleItems = query
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.category?.name ?? '').toLowerCase().includes(query)
      )
    : items

  const cartLines = Object.values(cart)
  const total = cartLines.reduce((sum, line) => sum + Number(line.price) * line.quantity, 0)

  function addToCart(item) {
    setCart((prev) => {
      const existingQty = prev[item.id]?.quantity || 0
      if (existingQty >= item.stock_quantity) return prev
      return {
        ...prev,
        [item.id]: { id: item.id, name: item.name, price: item.price, quantity: existingQty + 1 },
      }
    })
  }

  function changeQty(itemId, delta) {
    setCart((prev) => {
      const line = prev[itemId]
      if (!line) return prev
      const item = items.find((i) => i.id === itemId)
      const newQty = line.quantity + delta

      if (newQty <= 0) {
        const { [itemId]: _removed, ...rest } = prev
        return rest
      }
      if (item && newQty > item.stock_quantity) return prev

      return { ...prev, [itemId]: { ...line, quantity: newQty } }
    })
  }

  function removeFromCart(itemId) {
    setCart((prev) => {
      const { [itemId]: _removed, ...rest } = prev
      return rest
    })
  }

  async function handleConfirm() {
    setError('')
    setSuccessMessage('')

    if (cartLines.length === 0) {
      setError('Cart is empty. Add at least one item.')
      return
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Customer name and phone are required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        items: cartLines.map((line) => ({ item_id: line.id, quantity: line.quantity })),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        is_urgent: isUrgent,
      }

      const order = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setCart({})
      setCustomerName('')
      setCustomerPhone('')
      setIsUrgent(false)
      setSuccessMessage(`Order #${order.id} placed! Total: ${formatCurrency(order.total_amount)}`)
    } catch (err) {
      const message =
        err.data?.errors?.items?.[0] || err.data?.message || 'Failed to place order.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p>Loading catalog...</p>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <ShoppingCart size={22} color="var(--color-primary)" />
        <h1 style={{ fontSize: 22 }}>New Order</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20 }}>
        Pick items as the customer asks for them — the total updates live.
      </p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Left: search + catalog */}
        <div style={{ flex: '2 1 400px' }}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search
              size={16}
              color="var(--color-text-muted)"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type an item or category — e.g. juice, flour, cold drinks..."
              style={{ width: '100%', paddingLeft: 36 }}
              autoFocus
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: 14,
            }}
          >
            {visibleItems.map((item) => {
              const inCartQty = cart[item.id]?.quantity || 0
              const outOfStock = inCartQty >= item.stock_quantity
              return (
                <div key={item.id} className="card" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700 }}>{item.name}</div>
                  <div style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: 15, marginTop: 2 }}>
                    {formatCurrency(item.price)}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 12, marginTop: 2 }}>
                    In stock: {item.stock_quantity - inCartQty}
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    disabled={outOfStock}
                    className={outOfStock ? '' : 'btn-accent'}
                    style={{ marginTop: 10, width: '100%' }}
                  >
                    {outOfStock ? 'No more stock' : 'Add'}
                  </button>
                </div>
              )
            })}
            {visibleItems.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)' }}>
                {query ? `No items match "${searchQuery}".` : 'No items in your catalog yet.'}
              </p>
            )}
          </div>
        </div>

        {/* Right: cart / running total */}
        <div className="card" style={{ flex: '1 1 300px', padding: 20, alignSelf: 'flex-start' }}>
          <h2 style={{ fontSize: 16, marginBottom: 14 }}>Current Order</h2>

          {cartLines.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)' }}>No items selected yet.</p>
          )}

          {cartLines.map((line) => (
            <div
              key={line.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{line.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatCurrency(line.price)} each</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => changeQty(line.id, -1)} className="btn-ghost" style={{ padding: 6 }}>
                  <Minus size={14} />
                </button>
                <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 700 }}>{line.quantity}</span>
                <button onClick={() => changeQty(line.id, 1)} className="btn-ghost" style={{ padding: 6 }}>
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => removeFromCart(line.id)}
                  className="btn-ghost"
                  style={{ padding: 6, marginLeft: 4, color: 'var(--color-danger)' }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 800,
              fontSize: 19,
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <span>Total</span>
            <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(total)}</span>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, color: 'var(--color-text)' }}>Customer Name</label>
            <input
              type="text"
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{ width: '100%', marginBottom: 8 }}
            />
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, color: 'var(--color-text)' }}>Customer Phone</label>
            <input
              type="tel"
              placeholder="Customer phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
              We'll send a thank-you text once the order is paid.
            </p>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 12,
                padding: '8px 10px',
                borderRadius: 8,
                background: isUrgent ? 'var(--color-danger-light)' : 'transparent',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                style={{ width: 'auto' }}
              />
              <span style={{ fontWeight: 600, color: isUrgent ? 'var(--color-danger)' : 'var(--color-text)' }}>
                Urgent — pick this ahead of the queue
              </span>
            </label>
          </div>

          {error && <p style={{ color: 'var(--color-danger)', fontSize: 14, marginTop: 10 }}>{error}</p>}
          {successMessage && (
            <p style={{ color: 'var(--color-success)', fontSize: 14, marginTop: 10 }}>{successMessage}</p>
          )}

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="btn-primary"
            style={{ width: '100%', marginTop: 14, padding: 12, fontSize: 15 }}
          >
            {submitting ? 'Placing order...' : 'Confirm Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
