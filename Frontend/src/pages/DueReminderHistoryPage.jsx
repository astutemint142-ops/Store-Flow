import { useEffect, useState } from 'react'
import { Receipt } from 'lucide-react'
import { apiFetch } from '../api'
import { formatCurrency } from '../currency'
import DateRangeSearchBar from '../components/DateRangeSearchBar'

function formatDate(isoString) {
  return isoString.split('T')[0]
}

const STATUS_OPTIONS = [
  { value: '', label: 'Pending / Sent (not cleared)' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'cleared', label: 'Cleared' },
  { value: 'all', label: 'All' },
]

export default function DueReminderHistoryPage() {
  const [dues, setDues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clearingId, setClearingId] = useState(null)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (q) params.set('q', q)
    if (status) params.set('status', status)

    apiFetch(`/due-reminders?${params.toString()}`)
      .then(setDues)
      .catch(() => setError('Failed to load due reminders.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [dateFrom, dateTo, q, status])

  async function handleClearDue(dueId) {
    setError('')
    setClearingId(dueId)
    try {
      await apiFetch(`/due-reminders/${dueId}/clear`, { method: 'PATCH' })
      load()
    } catch (err) {
      setError(err.data?.message || 'Failed to clear due.')
    } finally {
      setClearingId(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Receipt size={22} color="var(--color-blush)" />
        <h1 style={{ fontSize: 22 }}>Due Reminders</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 16 }}>
        Every credit due, searchable by date or customer.
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
        statusOptions={STATUS_OPTIONS}
        searchPlaceholder="Search by customer name or phone..."
      />

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : dues.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No dues match these filters.</p>
      ) : (
        <div className="card" style={{ padding: 4, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ padding: '10px 16px' }}>Customer</th>
                <th style={{ padding: '10px 16px' }}>Phone</th>
                <th style={{ padding: '10px 16px' }}>Amount</th>
                <th style={{ padding: '10px 16px' }}>Next Reminder</th>
                <th style={{ padding: '10px 16px' }}>Status</th>
                <th style={{ padding: '10px 16px' }} />
              </tr>
            </thead>
            <tbody>
              {dues.map((due) => (
                <tr key={due.id}>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>{due.customer.name}</td>
                  <td style={{ padding: '10px 16px' }}>{due.customer.phone}</td>
                  <td style={{ padding: '10px 16px' }}>{formatCurrency(due.amount)}</td>
                  <td style={{ padding: '10px 16px' }}>{formatDate(due.next_reminder_date)}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span
                      className={`badge ${due.reminder_status === 'cleared' ? 'badge-success' : due.reminder_status === 'sent' ? 'badge-success' : 'badge-warning'}`}
                    >
                      {due.reminder_status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {due.reminder_status !== 'cleared' && (
                      <button
                        className="btn-primary"
                        disabled={clearingId === due.id}
                        onClick={() => handleClearDue(due.id)}
                        style={{ padding: '5px 10px', fontSize: 12 }}
                      >
                        {clearingId === due.id ? 'Clearing...' : 'Clear'}
                      </button>
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
