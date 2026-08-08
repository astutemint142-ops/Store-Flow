import { useEffect, useRef, useState } from 'react'
import { ClipboardList, AlertOctagon } from 'lucide-react'
import { apiFetch, getTenantId } from '../api'
import { createEcho } from '../echo'
import { formatDateTime } from '../datetime'

const ACTIVE_STATUSES = ['placed', 'picking']

function sortOrders(list) {
  return [...list].sort((a, b) => (b.is_urgent - a.is_urgent) || (a.id - b.id))
}

export default function WorkerPickList({ user }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmingId, setConfirmingId] = useState(null)
  const echoRef = useRef(null)

  useEffect(() => {
    apiFetch('/orders')
      .then((data) => {
        const active = data.filter((order) => ACTIVE_STATUSES.includes(order.order_status))
        setOrders(sortOrders(active))
      })
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))

    const echo = createEcho()
    echoRef.current = echo
    const channelName = `orders.pick-list.${getTenantId()}`

    echo
      .private(channelName)
      .listen('.order.placed', (e) => {
        // The tenant-wide channel broadcasts every order, but each worker
        // should only ever see the ones actually assigned to them —
        // unassigned (queued) orders stay invisible until dispatched.
        if (e.order.assigned_worker_id !== user.id) return

        setOrders((prev) => {
          if (prev.some((o) => o.id === e.order.id)) return prev
          return sortOrders([...prev, e.order])
        })
      })
      .listen('.order.updated', (e) => {
        if (e.order.assigned_worker_id !== user.id) return

        setOrders((prev) => {
          if (!prev.some((o) => o.id === e.order.id)) return prev
          return sortOrders(prev.map((o) => (o.id === e.order.id ? e.order : o)))
        })
      })
      .listen('.order.ready', (e) => {
        setOrders((prev) => prev.filter((o) => o.id !== e.order_id))
      })

    return () => {
      echo.leave(channelName)
      echo.disconnect()
    }
  }, [])

  async function toggleCollected(order, orderItem) {
    setError('')
    try {
      const updatedOrder = await apiFetch(`/orders/${order.id}/items/${orderItem.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_collected: !orderItem.is_collected }),
      })

      setOrders((prev) => sortOrders(prev.map((o) => (o.id === order.id ? updatedOrder : o))))
    } catch {
      setError('Failed to update item. Please try again.')
    }
  }

  async function confirmReady(order) {
    setError('')
    setConfirmingId(order.id)
    try {
      await apiFetch(`/orders/${order.id}/confirm-ready`, { method: 'PATCH' })
      setOrders((prev) => prev.filter((o) => o.id !== order.id))
    } catch (err) {
      setError(err.data?.message || 'Failed to confirm this order as ready.')
    } finally {
      setConfirmingId(null)
    }
  }

  if (loading) return <p>Loading pick list...</p>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <ClipboardList size={22} color="var(--color-primary)" />
        <h1 style={{ fontSize: 22 }}>Pick List</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20 }}>
        New orders appear here automatically. Tick each item off as you collect it — once
        everything is ticked, do a final crosscheck and confirm the order as ready.
      </p>

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {orders.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>No pending orders right now.</p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: 16,
        }}
      >
        {orders.map((order) => {
          const allCollected = order.items.every((oi) => oi.is_collected)
          return (
            <div
              key={order.id}
              className="card"
              style={{ padding: 18, border: order.is_urgent ? '2px solid var(--color-danger)' : undefined }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 6 }}>
                <strong style={{ fontSize: 15 }}>Order #{order.id}</strong>
                <div style={{ display: 'flex', gap: 6 }}>
                  {order.is_urgent && (
                    <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertOctagon size={12} /> URGENT
                    </span>
                  )}
                  <span className={`badge ${order.order_status === 'picking' ? 'badge-warning' : 'badge-neutral'}`}>
                    {order.order_status}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                {formatDateTime(order.created_at)}
              </div>

              {order.items.map((orderItem) => (
                <label
                  key={orderItem.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 0',
                    borderBottom: '1px solid var(--color-border)',
                    textDecoration: orderItem.is_collected ? 'line-through' : 'none',
                    color: orderItem.is_collected ? 'var(--color-text-muted)' : 'var(--color-text)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={orderItem.is_collected}
                    onChange={() => toggleCollected(order, orderItem)}
                    style={{ width: 'auto' }}
                  />
                  {orderItem.item.name} × {orderItem.quantity}
                </label>
              ))}

              {allCollected && (
                <div style={{ marginTop: 12, padding: 10, background: 'var(--color-primary-light)', borderRadius: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                    Everything's ticked — do a quick crosscheck, then confirm:
                  </p>
                  <button
                    onClick={() => confirmReady(order)}
                    disabled={confirmingId === order.id}
                    className="btn-primary"
                    style={{ width: '100%' }}
                  >
                    {confirmingId === order.id ? 'Confirming...' : 'Review & Confirm Ready'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
