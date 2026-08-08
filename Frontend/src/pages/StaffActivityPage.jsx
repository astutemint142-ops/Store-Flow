import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { apiFetch } from '../api'
import { formatCurrency } from '../currency'
import DateRangeSearchBar from '../components/DateRangeSearchBar'

export default function StaffActivityPage() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)

    apiFetch(`/reports/staff-activity?${params.toString()}`)
      .then(setStaff)
      .catch(() => setError('Failed to load staff activity.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [dateFrom, dateTo])

  if (error) return <p style={{ color: 'var(--color-danger)' }}>{error}</p>

  const counterStaff = staff.filter((s) => s.role === 'counter_staff')
  const storeWorkers = staff.filter((s) => s.role === 'store_worker')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Activity size={22} color="var(--color-primary)" />
        <h1 style={{ fontSize: 22 }}>Staff Activity</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 16 }}>
        How much work each staff member has handled.
      </p>

      <DateRangeSearchBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        showSearch={false}
      />

      {loading && <p>Loading...</p>}

      <section className="card" style={{ padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 14 }}>Counter Staff</h2>
        {counterStaff.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No counter staff accounts yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Orders Taken</th>
                  <th>Total Sales</th>
                </tr>
              </thead>
              <tbody>
                {counterStaff.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.orders_count}</td>
                    <td>{formatCurrency(s.total_sales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card" style={{ padding: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 14 }}>Store Workers</h2>
        {storeWorkers.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No store worker accounts yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Orders Picked</th>
                </tr>
              </thead>
              <tbody>
                {storeWorkers.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{s.orders_count}</td>
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
