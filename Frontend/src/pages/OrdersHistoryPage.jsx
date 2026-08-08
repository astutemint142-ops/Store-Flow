import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { History } from 'lucide-react'
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

export default function OrdersHistoryPage({ mode = 'all' }) {
  const [orders, setOrders] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [bookedBy, setBookedBy] = useState('')

  function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    if (mode === 'mine') {
      params.set('created_by', 'me')
    } else if (bookedBy) {
      params.set('created_by', bookedBy)
    }

    apiFetch(`/orders?${params.toString()}`)
      .then(setOrders)
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [dateFrom, dateTo, q, status, bookedBy, mode])

  useEffect(() => {
    if (mode === 'all') {
      apiFetch('/staff')
        .then((data) => setStaff(data.filter((s) => s.role === 'counter_staff')))
        .catch(() => {})
    }
  }, [mode])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <History size={22} color="var(--color-primary)" />
        <h1 style={{ fontSize: 22 }}>{mode === 'mine' ? 'My Orders' : 'Order History'}</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 16 }}>
        {mode === 'mine'
          ? 'Every order you have booked — search by date or customer.'
          : 'Every order ever placed, searchable by date, status, or customer.'}
      </p>

      <DateRangeSearchBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        q={q}
        onQChange={setQ}
        status={status}
        onStatusChange={setStatus}
      >
        {mode === 'all' && (
          <select value={bookedBy} onChange={(e) => setBookedBy(e.target.value)} style={{ padding: '6px 8px' }}>
            <option value="">All Counter Staff</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </DateRangeSearchBar>

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
                {mode === 'all' && <th style={{ padding: '10px 16px' }}>Booked By</th>}
                <th style={{ padding: '10px 16px' }}>Placed At</th>
                <th style={{ padding: '10px 16px' }} />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>#{order.id}</td>
                  <td style={{ padding: '10px 16px' }}>
                    {order.customer?.name} <span style={{ color: 'var(--color-text-muted)' }}>({order.customer?.phone})</span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>{order.items.map((oi) => oi.item.name).join(', ')}</td>
                  <td style={{ padding: '10px 16px' }}>{formatCurrency(order.total_amount)}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <OrderStatusBadge status={order.order_status} />
                    {order.is_urgent && <span className="badge badge-danger" style={{ marginLeft: 6 }}>URGENT</span>}
                  </td>
                  {mode === 'all' && <td style={{ padding: '10px 16px' }}>{order.creator?.name ?? '—'}</td>}
                  <td style={{ padding: '10px 16px', color: 'var(--color-text-muted)', fontSize: 13 }}>
                    {formatDateTime(order.created_at)}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {['placed', 'picking'].includes(order.order_status) && (
                      <Link to={`/orders/${order.id}/edit`} state={{ order }} className="btn-ghost" style={{ fontSize: 12 }}>
                        Edit
                      </Link>
                    )}
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
