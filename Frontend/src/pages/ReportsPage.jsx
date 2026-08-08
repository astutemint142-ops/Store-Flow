import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { BarChart3, Download } from 'lucide-react'
import { apiFetch } from '../api'
import { formatCurrency } from '../currency'

const COLOR_BLUE = '#2a78d6'
const COLOR_ORANGE = '#eb6834'
const COLOR_AQUA = '#1baf7a'
const PAYMENT_COLORS = [COLOR_BLUE, COLOR_ORANGE, COLOR_AQUA]

const GRID_COLOR = '#e1e0d9'
const AXIS_COLOR = '#898781'
const TEXT_SECONDARY = '#52514e'

function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function SectionHeader({ title, onExport }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <h2 style={{ fontSize: 16, margin: 0 }}>{title}</h2>
      <button onClick={onExport} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '5px 10px' }}>
        <Download size={13} /> Export CSV
      </button>
    </div>
  )
}

export default function ReportsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/reports/summary')
      .then(setData)
      .catch(() => setError('Failed to load reports.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading reports...</p>
  if (error) return <p style={{ color: 'var(--color-danger)' }}>{error}</p>

  const salesChartData = data.sales_over_time.map((d) => ({
    date: d.date.slice(5),
    total: d.total,
  }))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <BarChart3 size={22} color="var(--color-primary)" />
        <h1 style={{ fontSize: 22 }}>Reports</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Sales trends, best sellers, and how customers are paying.
      </p>

      <section className="card" style={{ padding: 20, marginBottom: 24 }}>
        <SectionHeader
          title="Sales — Last 30 Days"
          onExport={() =>
            downloadCsv('sales_last_30_days.csv', [
              ['Date', 'Total Sales'],
              ...data.sales_over_time.map((d) => [d.date, d.total]),
            ])
          }
        />
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={salesChartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: AXIS_COLOR }}
              axisLine={{ stroke: GRID_COLOR }}
              tickLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 11, fill: AXIS_COLOR }}
              axisLine={{ stroke: GRID_COLOR }}
              tickLine={false}
              width={50}
            />
            <Tooltip formatter={(value) => [formatCurrency(value), 'Sales']} contentStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="total"
              stroke={COLOR_BLUE}
              strokeWidth={2}
              dot={{ r: 3, fill: COLOR_BLUE, stroke: '#fcfcfb', strokeWidth: 1 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className="card" style={{ padding: 20, marginBottom: 24 }}>
        <SectionHeader
          title="Top-Selling Items"
          onExport={() =>
            downloadCsv('top_selling_items.csv', [
              ['Item', 'Quantity Sold', 'Revenue'],
              ...data.top_items.map((i) => [i.name, i.quantity, i.revenue]),
            ])
          }
        />
        {data.top_items.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No completed sales yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={data.top_items.length * 50 + 20}>
            <BarChart
              data={data.top_items}
              layout="vertical"
              margin={{ top: 10, right: 40, left: 10, bottom: 0 }}
            >
              <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: AXIS_COLOR }}
                axisLine={{ stroke: GRID_COLOR }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: TEXT_SECONDARY }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip formatter={(value) => [value, 'Quantity Sold']} contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="quantity" fill={COLOR_BLUE} radius={[0, 4, 4, 0]} barSize={20}>
                <LabelList dataKey="quantity" position="right" style={{ fontSize: 11, fill: TEXT_SECONDARY }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <section className="card" style={{ padding: 20 }}>
        <SectionHeader
          title="Payment Type Breakdown"
          onExport={() =>
            downloadCsv('payment_breakdown.csv', [
              ['Payment Type', 'Order Count', 'Total'],
              ...data.payment_breakdown.map((p) => [p.payment_type, p.count, p.total]),
            ])
          }
        />
        {data.payment_breakdown.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No completed sales yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.payment_breakdown}
                dataKey="total"
                nameKey="payment_type"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                label={({ payment_type, total }) => `${payment_type}: ${formatCurrency(total)}`}
              >
                {data.payment_breakdown.map((entry, index) => (
                  <Cell
                    key={entry.payment_type}
                    fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                    stroke="#fcfcfb"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  )
}
