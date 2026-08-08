import { useEffect, useState } from 'react'
import { Users, Plus } from 'lucide-react'
import { apiFetch } from '../api'
import PasswordInput from '../components/PasswordInput'

const emptyForm = { name: '', email: '', password: '', role: 'counter_staff' }

export default function StaffManagementPage() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  function loadStaff() {
    setLoading(true)
    apiFetch('/staff')
      .then(setStaff)
      .catch(() => setError('Failed to load staff.'))
      .finally(() => setLoading(false))
  }

  useEffect(loadStaff, [])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setSubmitting(true)

    try {
      await apiFetch('/staff', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setForm(emptyForm)
      setSuccessMessage('Staff account created.')
      loadStaff()
    } catch (err) {
      const message = err.data?.errors?.email?.[0] || err.data?.message || 'Failed to create staff account.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    setError('')
    try {
      await apiFetch(`/staff/${id}`, { method: 'DELETE' })
      loadStaff()
    } catch (err) {
      setError(err.data?.message || 'Failed to remove staff account.')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Users size={22} color="var(--color-primary)" />
        <h1 style={{ fontSize: 22 }}>Staff</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20 }}>
        Create login accounts for your Counter Staff and Store Workers — they only ever see your own business's data.
      </p>

      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          padding: 16,
          margin: '0 0 20px',
          alignItems: 'end',
        }}
      >
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>Password</label>
          <PasswordInput value={form.password} onChange={(e) => updateField('password', e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>Role</label>
          <select value={form.role} onChange={(e) => updateField('role', e.target.value)} style={{ width: '100%' }}>
            <option value="counter_staff">Counter Staff</option>
            <option value="store_worker">Store Worker</option>
          </select>
        </div>
        <button type="submit" className="btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Plus size={16} /> {submitting ? 'Creating...' : 'Add Staff'}
        </button>
      </form>

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
      {successMessage && <p style={{ color: 'var(--color-success)' }}>{successMessage}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="card" style={{ padding: 4, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ padding: '10px 16px' }}>Name</th>
                <th style={{ padding: '10px 16px' }}>Email</th>
                <th style={{ padding: '10px 16px' }}>Role</th>
                <th style={{ padding: '10px 16px', width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id}>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>{member.name}</td>
                  <td style={{ padding: '10px 16px' }}>{member.email}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className="badge badge-neutral">{member.role.replace('_', ' ')}</span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <button className="btn-danger" onClick={() => handleDelete(member.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '10px 16px', color: 'var(--color-text-muted)' }}>
                    No staff accounts yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
