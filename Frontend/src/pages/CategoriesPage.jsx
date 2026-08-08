import { useEffect, useState } from 'react'
import { Tags, Plus } from 'lucide-react'
import { apiFetch } from '../api'

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  function loadCategories() {
    setLoading(true)
    apiFetch('/categories')
      .then(setCategories)
      .catch(() => setError('Failed to load categories.'))
      .finally(() => setLoading(false))
  }

  useEffect(loadCategories, [])

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    try {
      await apiFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newName }),
      })
      setNewName('')
      loadCategories()
    } catch (err) {
      setError(err.data?.message || 'Failed to add category.')
    }
  }

  function startEdit(category) {
    setEditingId(category.id)
    setEditingName(category.name)
  }

  async function handleUpdate(e, id) {
    e.preventDefault()
    setError('')
    try {
      await apiFetch(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editingName }),
      })
      setEditingId(null)
      loadCategories()
    } catch (err) {
      setError(err.data?.message || 'Failed to update category.')
    }
  }

  async function handleDelete(id) {
    setError('')
    try {
      await apiFetch(`/categories/${id}`, { method: 'DELETE' })
      loadCategories()
    } catch (err) {
      setError(err.data?.message || 'Failed to delete category.')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Tags size={22} color="var(--color-primary)" />
        <h1 style={{ fontSize: 22 }}>Categories</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20 }}>
        Group your items — Beverages, Snacks, Cosmetics, and so on.
      </p>

      <form onSubmit={handleAdd} className="card" style={{ padding: 16, margin: '0 0 20px', display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="New category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Add Category
        </button>
      </form>

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="card" style={{ padding: 4 }}>
          <table>
            <thead>
              <tr>
                <th style={{ padding: '10px 16px' }}>Name</th>
                <th style={{ padding: '10px 16px', width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td style={{ padding: '10px 16px' }}>
                    {editingId === category.id ? (
                      <form
                        onSubmit={(e) => handleUpdate(e, category.id)}
                        style={{ display: 'flex', gap: 8 }}
                      >
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          required
                          style={{ flex: 1 }}
                        />
                        <button type="submit" className="btn-primary">
                          Save
                        </button>
                        <button type="button" className="btn-ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </form>
                    ) : (
                      category.name
                    )}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {editingId !== category.id && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-ghost" onClick={() => startEdit(category)}>
                          Edit
                        </button>
                        <button className="btn-danger" onClick={() => handleDelete(category.id)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ padding: '10px 16px', color: 'var(--color-text-muted)' }}>
                    No categories yet. Add one above.
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
