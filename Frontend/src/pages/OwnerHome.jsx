import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Wallet, ShoppingBag, AlertTriangle, Receipt } from 'lucide-react'
import { apiFetch } from '../api'
import { formatCurrency } from '../currency'
import { formatDateTime } from '../datetime'

function formatDate(isoString) {
  return isoString.split('T')[0]
}

function OrderStatusBadge({ status }) {
  const map = {
    placed: 'badge-warning',
    picking: 'badge-warning',
    ready: 'badge-neutral',
    completed: 'badge-success',
  }
  return <span className={`badge ${map[status] ?? 'badge-neutral'}`}>{status}</span>
}

function StatCard({ icon, iconBg, label, value, onClick }) {
  return (
    <button
      className="card"
      onClick={onClick}
      style={{
        padding: 18,
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 42,
          height: 42,
          borderRadius: 12,
          background: iconBg,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
        <span style={{ display: 'block', fontSize: 21, fontWeight: 800, marginTop: 2 }}>{value}</span>
      </span>
    </button>
  )
}

export default function OwnerHome() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clearingId, setClearingId] = useState(null)
  const navigate = useNavigate()

  function loadSummary() {
    setLoading(true)
    apiFetch('/dashboard/summary')
      .then(setSummary)
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }

  useEffect(loadSummary, [])

  async function handleClearDue(dueId) {
    setError('')
    setClearingId(dueId)
    try {
      await apiFetch(`/due-reminders/${dueId}/clear`, { method: 'PATCH' })
      loadSummary()
    } catch (err) {
      setError(err.data?.message || 'Failed to clear due.')
    } finally {
      setClearingId(null)
    }
  }

  if (loading) return <p>Loading dashboard...</p>
  if (error) return <p style={{ color: 'var(--color-danger)' }}>{error}</p>

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Owner Dashboard</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20 }}>
        A quick look at how the store is doing today.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 14,
          marginBottom: 28,
        }}
      >
        <StatCard
          icon={<Wallet size={20} color="var(--color-primary)" />}
          iconBg="var(--color-primary-light)"
          label="Today's Sales"
          value={formatCurrency(summary.todays_sales_total)}
          onClick={() => navigate('/orders/history')}
        />
        <StatCard
          icon={<ShoppingBag size={20} color="var(--color-accent)" />}
          iconBg="var(--color-accent-light)"
          label="Today's Orders"
          value={summary.todays_orders_count}
          onClick={() => navigate('/orders/history')}
        />
        <StatCard
          icon={<AlertTriangle size={20} color="var(--color-warning)" />}
          iconBg="var(--color-warning-light)"
          label="Low Stock Items"
          value={summary.low_stock_items.length}
          onClick={() => navigate('/low-stock')}
        />
        <StatCard
          icon={<Receipt size={20} color="var(--color-blush)" />}
          iconBg="var(--color-blush-light)"
          label="Pending Dues"
          value={summary.pending_dues_count}
          onClick={() => navigate('/due-reminders')}
        />
      </div>

      <section className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>Today's Orders (most recent)</h2>
          <Link to="/orders/history" style={{ fontSize: 13 }}>View all →</Link>
        </div>
        {summary.todays_orders.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No orders placed today yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Placed At</th>
                </tr>
              </thead>
              <tbody>
                {summary.todays_orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.items.map((oi) => oi.item.name).join(', ')}</td>
                    <td>{formatCurrency(order.total_amount)}</td>
                    <td>
                      <OrderStatusBadge status={order.order_status} />
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{order.payment_type || '—'}</td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{formatDateTime(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}
      >
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Low Stock Alerts</h2>
          {summary.low_stock_items.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Nothing is low on stock right now.</p>
          ) : (
            <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
              {summary.low_stock_items.map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <span>{item.name}</span>
                  <span className="badge badge-danger">{item.stock_quantity} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>Pending Dues (most recent)</h2>
            <Link to="/due-reminders" style={{ fontSize: 13 }}>View all →</Link>
          </div>
          {summary.pending_dues.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No pending dues right now.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Next Reminder</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {summary.pending_dues.map((due) => (
                    <tr key={due.id}>
                      <td>{due.customer.name}</td>
                      <td>{due.customer.phone}</td>
                      <td>{formatCurrency(due.amount)}</td>
                      <td>{formatDate(due.next_reminder_date)}</td>
                      <td>
                        <span className={`badge ${due.reminder_status === 'sent' ? 'badge-success' : 'badge-warning'}`}>
                          {due.reminder_status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-primary"
                          disabled={clearingId === due.id}
                          onClick={() => handleClearDue(due.id)}
                          style={{ padding: '5px 10px', fontSize: 12 }}
                        >
                          {clearingId === due.id ? 'Clearing...' : 'Clear'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="card" style={{ padding: 20, marginTop: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Reminder History</h2>
        {summary.recent_reminders.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No reminders sent yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Sent At</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent_reminders.map((log) => (
                  <tr key={log.id}>
                    <td>{log.due_reminder?.customer?.name ?? '—'}</td>
                    <td style={{ textTransform: 'uppercase', fontSize: 12 }}>{log.channel}</td>
                    <td>
                      <span className={`badge ${log.status === 'sent' ? 'badge-success' : 'badge-danger'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td>{formatDate(log.sent_at)}</td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{log.failure_reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
