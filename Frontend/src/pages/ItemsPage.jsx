import { useEffect, useRef, useState } from 'react'
import { Package, Plus, FileSpreadsheet, Download } from 'lucide-react'
import { apiFetch } from '../api'
import { formatCurrency } from '../currency'

const TEMPLATE_HEADERS = ['Category', 'Name', 'Price', 'Purchase Price', 'Stock Quantity', 'Low Stock Threshold']

function downloadTemplate() {
  const csv = TEMPLATE_HEADERS.join(',') + '\n' + 'Juices,Apple Juice,150,110,30,5\n'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'storeflow_items_template.csv'
  link.click()
  URL.revokeObjectURL(url)
}

const emptyForm = {
  category_id: '',
  name: '',
  price: '',
  purchase_price: '',
  stock_quantity: '',
  low_stock_threshold: '',
}

export default function ItemsPage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef(null)

  function loadData() {
    setLoading(true)
    Promise.all([apiFetch('/items'), apiFetch('/categories')])
      .then(([itemsData, categoriesData]) => {
        setItems(itemsData)
        setCategories(categoriesData)
      })
      .catch(() => setError('Failed to load items.'))
      .finally(() => setLoading(false))
  }

  useEffect(loadData, [])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      category_id: item.category_id,
      name: item.name,
      price: item.price,
      purchase_price: item.purchase_price,
      stock_quantity: item.stock_quantity,
      low_stock_threshold: item.low_stock_threshold,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const payload = {
      category_id: Number(form.category_id),
      name: form.name,
      price: Number(form.price),
      purchase_price: Number(form.purchase_price),
      stock_quantity: Number(form.stock_quantity),
      low_stock_threshold: Number(form.low_stock_threshold),
    }

    try {
      if (editingId) {
        await apiFetch(`/items/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/items', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      cancelEdit()
      loadData()
    } catch (err) {
      setError(err.data?.message || 'Failed to save item.')
    }
  }

  async function handleImportSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError('')
    setImportResult(null)
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await apiFetch('/items/import', { method: 'POST', body: formData })
      setImportResult(result)
      loadData()
    } catch (err) {
      setImportError(err.data?.message || 'Failed to import file.')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  async function handleDelete(id) {
    setError('')
    try {
      await apiFetch(`/items/${id}`, { method: 'DELETE' })
      loadData()
    } catch (err) {
      setError(err.data?.message || 'Failed to delete item.')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Package size={22} color="var(--color-primary)" />
        <h1 style={{ fontSize: 22 }}>Items</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 20 }}>
        Manage your catalog — pricing, stock, and low-stock alerts.
      </p>

      <div
        className="card"
        style={{ padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleImportSelected}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className="btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FileSpreadsheet size={16} /> {importing ? 'Importing...' : 'Import from Excel/CSV'}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={downloadTemplate}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Download size={14} /> Download Template
        </button>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          Columns: Category, Name, Price, Purchase Price, Stock Quantity, Low Stock Threshold
        </span>
        {importError && <p style={{ color: 'var(--color-danger)', fontSize: 13, width: '100%', margin: 0 }}>{importError}</p>}
        {importResult && (
          <div style={{ width: '100%', fontSize: 13 }}>
            <p style={{ color: 'var(--color-success)', margin: 0 }}>
              {importResult.created} item(s) added, {importResult.updated} updated.
            </p>
            {importResult.errors.length > 0 && (
              <ul style={{ color: 'var(--color-danger)', margin: '6px 0 0', paddingLeft: 18 }}>
                {importResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          padding: 16,
          margin: '0 0 20px',
          alignItems: 'end',
        }}
      >
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>Category</label>
          <select
            value={form.category_id}
            onChange={(e) => updateField('category_id', e.target.value)}
            required
            style={{ width: '100%' }}
          >
            <option value="">Select...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
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
          <label style={{ display: 'block', marginBottom: 4 }}>Price</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => updateField('price', e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>Purchase Price</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.purchase_price}
            onChange={(e) => updateField('purchase_price', e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>Stock Qty</label>
          <input
            type="number"
            min="0"
            value={form.stock_quantity}
            onChange={(e) => updateField('stock_quantity', e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>Low Stock Alert At</label>
          <input
            type="number"
            min="0"
            value={form.low_stock_threshold}
            onChange={(e) => updateField('low_stock_threshold', e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {editingId ? 'Save' : (<><Plus size={16} /> Add Item</>)}
          </button>
          {editingId && (
            <button type="button" className="btn-ghost" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="card" style={{ padding: 4, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ padding: '10px 16px' }}>Name</th>
                <th style={{ padding: '10px 16px' }}>Category</th>
                <th style={{ padding: '10px 16px' }}>Price</th>
                <th style={{ padding: '10px 16px' }}>Purchase Price</th>
                <th style={{ padding: '10px 16px' }}>Stock</th>
                <th style={{ padding: '10px 16px' }}>Low Stock At</th>
                <th style={{ padding: '10px 16px', width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: '10px 16px' }}>{item.category?.name}</td>
                  <td style={{ padding: '10px 16px' }}>{formatCurrency(item.price)}</td>
                  <td style={{ padding: '10px 16px' }}>{formatCurrency(item.purchase_price)}</td>
                  <td style={{ padding: '10px 16px' }}>
                    {item.stock_quantity}
                    {item.stock_quantity <= item.low_stock_threshold && (
                      <span className="badge badge-danger" style={{ marginLeft: 8 }}>Low</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px' }}>{item.low_stock_threshold}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-ghost" onClick={() => startEdit(item)}>
                        Edit
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(item.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '10px 16px', color: 'var(--color-text-muted)' }}>
                    No items yet. Add one above.
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
