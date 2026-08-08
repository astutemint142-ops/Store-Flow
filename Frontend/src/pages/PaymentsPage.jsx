import { useEffect, useState } from 'react'
import { Wallet, RefreshCw, MessageCircle, X } from 'lucide-react'
import { apiFetch } from '../api'
import { formatCurrency } from '../currency'
import { formatDateTime } from '../datetime'
import { buildWhatsAppReceiptUrl } from '../whatsapp'

const emptyPaymentForm = { payment_type: 'cash', customer_name: '', customer_phone: '' }

export default function PaymentsPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [forms, setForms] = useState({})
  const [submittingId, setSubmittingId] = useState(null)
  const [paidOrders, setPaidOrders] = useState([])

  function loadOrders() {
    setLoading(true)
    apiFetch('/orders')
      .then((data) => {
        const ready = data.filter((order) => order.order_status === 'ready')
        setOrders(ready)
      })
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))
  }

  useEffect(loadOrders, [])

  function formFor(orderId) {
    return forms[orderId] || emptyPaymentForm
  }

  function updateForm(orderId, field, value) {
    setForms((prev) => ({
      ...prev,
      [orderId]: { ...formFor(orderId), [field]: value },
    }))
  }

  async function handlePay(order) {
    setError('')
    const form = formFor(order.id)

    if (form.payment_type === 'credit' && !order.customer) {
      if (!form.customer_name.trim() || !form.customer_phone.trim()) {
        setError('Customer name and phone are required for a credit payment.')
        return
      }
    }

    setSubmittingId(order.id)
    try {
      const payload = { payment_type: form.payment_type }
      if (form.payment_type === 'credit' && !order.customer) {
        payload.customer_name = form.customer_name.trim()
        payload.customer_phone = form.customer_phone.trim()
      }

      const paidOrder = await apiFetch(`/orders/${order.id}/pay`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      setOrders((prev) => prev.filter((o) => o.id !== order.id))
      if (paidOrder.customer?.phone) {
        setPaidOrders((prev) => [paidOrder, ...prev])
      }
    } catch (err) {
      setError(err.data?.message || 'Failed to process payment.')
    } finally {
      setSubmittingId(null)
    }
  }

  function dismissReceipt(orderId) {
    setPaidOrders((prev) => prev.filter((o) => o.id !== orderId))
  }

  if (loading) return <p>Loading ready orders...</p>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Wallet size={22} color="var(--color-primary)" />
        <h1 style={{ fontSize: 22 }}>Payments</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 16 }}>
        These orders are "ready" — the worker has collected everything. Select a payment type to process each one.
      </p>

      <button onClick={loadOrders} className="btn-ghost" style={{ marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <RefreshCw size={14} /> Refresh
      </button>

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {paidOrders.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, marginBottom: 10 }}>Send Receipt</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {paidOrders.map((order) => (
              <div key={order.id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 14 }}>Order #{order.id} paid</strong>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    {order.customer.name} · {order.customer.phone}
                  </div>
                </div>
                <a
                  href={buildWhatsAppReceiptUrl(order, order.customer.phone, order.tenant?.business_name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', padding: '7px 12px' }}
                  title="Send receipt via WhatsApp"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
                <button
                  onClick={() => dismissReceipt(order.id)}
                  className="btn-ghost"
                  style={{ padding: 6 }}
                  title="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No orders waiting for payment.</p>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {orders.map((order) => {
          const form = formFor(order.id)
          return (
            <div key={order.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: 15 }}>Order #{order.id}</strong>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDateTime(order.created_at)}</span>
              </div>
              <ul style={{ paddingLeft: 18, margin: '10px 0', color: 'var(--color-text-secondary)', fontSize: 14 }}>
                {order.items.map((orderItem) => (
                  <li key={orderItem.id}>
                    {orderItem.item.name} × {orderItem.quantity}
                  </li>
                ))}
              </ul>
              <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--color-primary)', marginBottom: 12 }}>
                Total: {formatCurrency(order.total_amount)}
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {['cash', 'card', 'credit'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateForm(order.id, 'payment_type', type)}
                    className={form.payment_type === type ? 'btn-primary' : ''}
                    style={{ flex: 1, padding: '7px 0', fontSize: 13 }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {form.payment_type === 'credit' && !order.customer && (
                <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Customer name"
                    value={form.customer_name}
                    onChange={(e) => updateForm(order.id, 'customer_name', e.target.value)}
                    style={{ width: '100%' }}
                  />
                  <input
                    type="tel"
                    placeholder="Customer phone"
                    value={form.customer_phone}
                    onChange={(e) => updateForm(order.id, 'customer_phone', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {form.payment_type === 'credit' && order.customer && (
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                  Credit for: {order.customer.name} ({order.customer.phone})
                </p>
              )}

              <button
                onClick={() => handlePay(order)}
                disabled={submittingId === order.id}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                {submittingId === order.id ? 'Processing...' : 'Mark as Paid'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
