import { useEffect, useState } from 'react'
import { PackageCheck } from 'lucide-react'
import { apiFetch } from '../api'
import { formatCurrency } from '../currency'
import { formatDateTime } from '../datetime'
import DateRangeSearchBar from '../components/DateRangeSearchBar'

function OrderStatusBadge({ status }) {
  const map = {
    placed: 'badge-warning',
    picking: 'badge-warning',
    ready: 'badge-neutral',
    completed: 'badge-success',
  }
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status}</span>
}

function isToday(isoString) {
  return isoString.slice(0, 10) === new Date().toISOString().slice(0, 10)
}

export default function MyPickedOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [q, setQ] = useState('')

  function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (q) params.set('q', q)

    apiFetch(`/orders?${params.toString()}`)
      .then(setOrders)
      .catch(() => setError('Failed to load your orders.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [dateFrom, dateTo, q])

  const completedToday = orders.filter((o) => o.order_status === 'completed' && isToday(o.updated_at ?? o.created_at)).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <PackageCheck size={22} color="var(--color-primary)" />
        <h1 style={{ fontSize: 22 }}>My Orders</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 16 }}>
        Every order that has ever been assigned to you.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ padding: 18 }}>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)' }}>Total Picked</span>
          <span style={{ display: 'block', fontSize: 21, fontWeight: 800, marginTop: 2 }}>{orders.length}</span>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)' }}>Completed Today</span>
          <span style={{ display: 'block', fontSize: 21, fontWeight: 800, marginTop: 2 }}>{completedToday}</span>
        </div>
      </div>

      <DateRangeSearchBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        q={q}
        onQChange={setQ}
        searchPlaceholder="Search by customer name, phone, or order #..."
      />

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No orders match these filters.</p>
      ) : (
        <div className="card" style={{ padding: 4, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ padding: '10px 16px' }}>Order #</th>
                <th style={{ padding: '10px 16px' }}>Customer</th>
                <th style={{ padding: '10px 16px' }}>Items</th>
                <th style={{ padding: '10px 16px' }}>Total</th>
                <th style={{ padding: '10px 16px' }}>Status</th>
                <th style={{ padding: '10px 16px' }}>Placed At</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>#{order.id}</td>
                  <td style={{ padding: '10px 16px' }}>{order.customer?.name}</td>
                  <td style={{ padding: '10px 16px' }}>{order.items.map((oi) => oi.item.name).join(', ')}</td>
                  <td style={{ padding: '10px 16px' }}>{formatCurrency(order.total_amount)}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <OrderStatusBadge status={order.order_status} />
                    {order.is_urgent && <span className="badge badge-danger" style={{ marginLeft: 6 }}>URGENT</span>}
                  </td>
                  <td style={{ padding: '10px 16px', color: 'var(--color-text-muted)', fontSize: 13 }}>
                    {formatDateTime(order.created_at)}
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
