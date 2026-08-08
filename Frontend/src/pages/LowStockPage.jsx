import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { apiFetch } from '../api'

export default function LowStockPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function loadItems() {
    setLoading(true)
    apiFetch('/items/low-stock')
      .then(setItems)
      .catch(() => setError('Failed to load low-stock items.'))
      .finally(() => setLoading(false))
  }

  useEffect(loadItems, [])

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <AlertTriangle size={22} color="var(--color-warning)" />
        <h1 style={{ fontSize: 22 }}>Low Stock Alerts</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 16 }}>
        Items at or below their low-stock threshold. Consider recording a purchase to top these up.
      </p>

      <button onClick={loadItems} className="btn-ghost" style={{ marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <RefreshCw size={14} /> Refresh
      </button>

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {items.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Nothing is low on stock right now.</p>
      ) : (
        <div className="card" style={{ padding: 4, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ padding: '10px 16px' }}>Item</th>
                <th style={{ padding: '10px 16px' }}>Category</th>
                <th style={{ padding: '10px 16px' }}>Stock Left</th>
                <th style={{ padding: '10px 16px' }}>Threshold</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: '10px 16px' }}>{item.category?.name}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className="badge badge-danger">{item.stock_quantity} left</span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>{item.low_stock_threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
