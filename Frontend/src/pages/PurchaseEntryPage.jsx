import { useEffect, useState } from 'react'
import { Truck, Plus } from 'lucide-react'
import { apiFetch } from '../api'
import { formatCurrency } from '../currency'
import { formatDateTime } from '../datetime'

export default function PurchaseEntryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [selectedItemId, setSelectedItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [lines, setLines] = useState([])

  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  function loadHistory() {
    setHistoryLoading(true)
    apiFetch('/purchases')
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }

  useEffect(() => {
    apiFetch('/items')
      .then(setItems)
      .catch(() => setError('Failed to load items.'))
      .finally(() => setLoading(false))
    loadHistory()
  }, [])

  const total = lines.reduce((sum, line) => sum + line.quantity * line.purchase_price, 0)

  function addLine(e) {
    e.preventDefault()
    setError('')

    const item = items.find((i) => i.id === Number(selectedItemId))
    if (!item || !quantity || !purchasePrice) return

    setLines((prev) => [
      ...prev,
      {
        item_id: item.id,
        name: item.name,
        quantity: Number(quantity),
        purchase_price: Number(purchasePrice),
      },
    ])

    setSelectedItemId('')
    setQuantity('')
    setPurchasePrice('')
  }

  function removeLine(index) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    setError('')
    setSuccessMessage('')

    if (lines.length === 0) {
      setError('Add at least one item to the purchase.')
      return
    }

    setSubmitting(true)
    try {
      const purchase = await apiFetch('/purchases', {
        method: 'POST',
        body: JSON.stringify({
          items: lines.map((line) => ({
            item_id: line.item_id,
            quantity: line.quantity,
            purchase_price: line.purchase_price,
          })),
        }),
      })

      setLines([])
      setSuccessMessage(`Purchase #${purchase.id} recorded! Total: ${formatCurrency(purchase.total_amount)}. Stock updated.`)
      loadHistory()
    } catch (err) {
      setError(err.data?.message || 'Failed to record purchase.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Truck size={22} color="var(--color-primary)" />
        <h1 style={{ fontSize: 22 }}>Record Purchase</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20 }}>
        Add the items and quantities that just arrived, along with what you paid per unit. Stock and purchase price will update automatically.
      </p>

      <form
        onSubmit={addLine}
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          padding: 16,
          margin: '0 0 20px',
          alignItems: 'end',
        }}
      >
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>Item</label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            required
            style={{ width: '100%' }}
          >
            <option value="">Select...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>Purchase Price (per unit)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        <button type="submit" className="btn-accent" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Plus size={16} /> Add to Purchase
        </button>
      </form>

      {lines.length > 0 && (
        <div className="card" style={{ padding: 4, marginBottom: 16, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ padding: '10px 16px' }}>Item</th>
                <th style={{ padding: '10px 16px' }}>Quantity</th>
                <th style={{ padding: '10px 16px' }}>Purchase Price</th>
                <th style={{ padding: '10px 16px' }}>Subtotal</th>
                <th style={{ padding: '10px 16px' }} />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={index}>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>{line.name}</td>
                  <td style={{ padding: '10px 16px' }}>{line.quantity}</td>
                  <td style={{ padding: '10px 16px' }}>{formatCurrency(line.purchase_price)}</td>
                  <td style={{ padding: '10px 16px' }}>{formatCurrency(line.quantity * line.purchase_price)}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <button className="btn-danger" onClick={() => removeLine(index)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lines.length > 0 && (
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16, color: 'var(--color-primary)' }}>
          Total: {formatCurrency(total)}
        </div>
      )}

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
      {successMessage && <p style={{ color: 'var(--color-success)' }}>{successMessage}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting || lines.length === 0}
        className="btn-primary"
        style={{ padding: '10px 24px' }}
      >
        {submitting ? 'Recording...' : 'Record Purchase'}
      </button>

      <h2 style={{ fontSize: 16, marginTop: 32, marginBottom: 12 }}>Recent Purchases</h2>
      {historyLoading ? (
        <p>Loading...</p>
      ) : history.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No purchases recorded yet.</p>
      ) : (
        <div className="card" style={{ padding: 4, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ padding: '10px 16px' }}>Purchase #</th>
                <th style={{ padding: '10px 16px' }}>Items</th>
                <th style={{ padding: '10px 16px' }}>Total</th>
                <th style={{ padding: '10px 16px' }}>Recorded By</th>
                <th style={{ padding: '10px 16px' }}>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((purchase) => (
                <tr key={purchase.id}>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>#{purchase.id}</td>
                  <td style={{ padding: '10px 16px' }}>
                    {purchase.items.map((pi) => `${pi.item.name} × ${pi.quantity}`).join(', ')}
                  </td>
                  <td style={{ padding: '10px 16px' }}>{formatCurrency(purchase.total_amount)}</td>
                  <td style={{ padding: '10px 16px' }}>{purchase.user?.name ?? '—'}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--color-text-muted)', fontSize: 13 }}>
                    {formatDateTime(purchase.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
