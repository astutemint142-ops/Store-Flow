import { Search } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'placed', label: 'Placed' },
  { value: 'picking', label: 'Picking' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
]

export default function DateRangeSearchBar({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  q,
  onQChange,
  showSearch = true,
  searchPlaceholder = 'Search by name, phone, or order #...',
  status,
  onStatusChange,
  statusOptions = STATUS_OPTIONS,
  children,
}) {
  return (
    <div
      className="card"
      style={{ padding: 14, marginBottom: 18, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>From</label>
        <input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} style={{ padding: '6px 8px' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>To</label>
        <input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} style={{ padding: '6px 8px' }} />
      </div>

      {onStatusChange && (
        <select value={status} onChange={(e) => onStatusChange(e.target.value)} style={{ padding: '6px 8px' }}>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {children}

      {showSearch && (
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder={searchPlaceholder}
            style={{ width: '100%', padding: '7px 10px 7px 30px' }}
          />
        </div>
      )}
    </div>
  )
}
