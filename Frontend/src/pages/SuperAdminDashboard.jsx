import { useEffect, useState } from 'react'
import { Building2, Trash2 } from 'lucide-react'
import { apiFetch } from '../api'

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  function loadTenants() {
    setLoading(true)
    apiFetch('/admin/tenants')
      .then(setTenants)
      .catch(() => setError('Failed to load businesses.'))
      .finally(() => setLoading(false))
  }

  useEffect(loadTenants, [])

  async function toggleStatus(tenant) {
    setError('')
    setBusyId(tenant.id)
    const action = tenant.status === 'active' ? 'suspend' : 'reactivate'
    try {
      await apiFetch(`/admin/tenants/${tenant.id}/${action}`, { method: 'PATCH' })
      loadTenants()
    } catch (err) {
      setError(err.data?.message || 'Failed to update business status.')
    } finally {
      setBusyId(null)
    }
  }

  function openDeleteModal(tenant) {
    setDeleteTarget(tenant)
    setConfirmText('')
    setDeleteError('')
  }

  function closeDeleteModal() {
    setDeleteTarget(null)
    setConfirmText('')
    setDeleteError('')
  }

  async function handleDelete() {
    if (!deleteTarget || confirmText !== deleteTarget.business_name) return
    setDeleting(true)
    setDeleteError('')
    try {
      await apiFetch(`/admin/tenants/${deleteTarget.id}`, { method: 'DELETE' })
      closeDeleteModal()
      loadTenants()
    } catch (err) {
      setDeleteError(err.data?.message || 'Failed to delete business.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Building2 size={22} color="var(--color-primary)" />
        <h1 style={{ fontSize: 22 }}>Businesses</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20 }}>
        Every business registered on StoreFlow. You can see basic info and suspend/reactivate an
        account, but never a business's actual store data (items, orders, customers).
      </p>

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="card" style={{ padding: 4, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ padding: '10px 16px' }}>Business</th>
                <th style={{ padding: '10px 16px' }}>Owner</th>
                <th style={{ padding: '10px 16px' }}>Staff</th>
                <th style={{ padding: '10px 16px' }}>Status</th>
                <th style={{ padding: '10px 16px', width: 200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>{tenant.business_name}</td>
                  <td style={{ padding: '10px 16px' }}>
                    {tenant.owner_name}
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{tenant.owner_email}</div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>{tenant.users_count}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className={`badge ${tenant.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className={tenant.status === 'active' ? 'btn-danger' : 'btn-primary'}
                        disabled={busyId === tenant.id}
                        onClick={() => toggleStatus(tenant)}
                      >
                        {tenant.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 5 }}
                        onClick={() => openDeleteModal(tenant)}
                        title="Permanently delete this business"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '10px 16px', color: 'var(--color-text-muted)' }}>
                    No businesses registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeDeleteModal}
        >
          <div
            className="card"
            style={{ padding: 24, maxWidth: 420, width: '90%', background: 'var(--color-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 17, color: 'var(--color-danger)', marginBottom: 8 }}>
              Permanently delete "{deleteTarget.business_name}"?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
              This cannot be undone. Every item, category, order, customer, purchase, due reminder,
              and staff account (including <strong>{deleteTarget.owner_email}</strong>) belonging to
              this business will be permanently removed — the email will become free to register again.
            </p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Type <strong>{deleteTarget.business_name}</strong> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              style={{ width: '100%', marginBottom: 12 }}
              autoFocus
            />
            {deleteError && <p style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 10 }}>{deleteError}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button
                className="btn-danger"
                disabled={confirmText !== deleteTarget.business_name || deleting}
                onClick={handleDelete}
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
