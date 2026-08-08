import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { apiFetch } from '../api'
import PageHeader from '../components/PageHeader'
import ThemedWatermark from '../components/ThemedWatermark'
import { formatCurrency } from '../currency'
import { colors } from '../theme'

const PAYMENT_COLORS = [colors.primary, colors.accent, colors.blush]

function SalesBars({ salesOverTime }) {
  const max = Math.max(1, ...salesOverTime.map((d) => Number(d.total)))
  const recent = salesOverTime.slice(-14)

  return (
    <View style={styles.barsRow}>
      {recent.map((d) => {
        const heightPct = Math.max(4, (Number(d.total) / max) * 100)
        return (
          <View key={d.date} style={styles.barColumn}>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { height: `${heightPct}%` }]} />
            </View>
            <Text style={styles.barLabel}>{d.date.slice(8)}</Text>
          </View>
        )
      })}
    </View>
  )
}

function TopItemsList({ topItems }) {
  const max = Math.max(1, ...topItems.map((i) => i.quantity))
  return (
    <View>
      {topItems.map((item) => (
        <View key={item.name} style={styles.topItemRow}>
          <Text style={styles.topItemName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.topItemBarTrack}>
            <View style={[styles.topItemBar, { width: `${(item.quantity / max) * 100}%` }]} />
          </View>
          <Text style={styles.topItemQty}>{item.quantity}</Text>
        </View>
      ))}
    </View>
  )
}

function PaymentBreakdown({ breakdown }) {
  const total = breakdown.reduce((sum, p) => sum + Number(p.total), 0) || 1
  return (
    <View>
      {breakdown.map((p, index) => {
        const pct = (Number(p.total) / total) * 100
        const color = PAYMENT_COLORS[index % PAYMENT_COLORS.length]
        return (
          <View key={p.payment_type} style={{ marginBottom: 12 }}>
            <View style={styles.paymentLabelRow}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={styles.paymentLabel}>{p.payment_type} · {p.count} order(s)</Text>
              <Text style={styles.paymentValue}>{formatCurrency(p.total)}</Text>
            </View>
            <View style={styles.paymentTrack}>
              <View style={[styles.paymentFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
          </View>
        )
      })}
    </View>
  )
}

export default function ReportsScreen() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      apiFetch('/reports/summary')
        .then(setData)
        .catch(() => setError('Failed to load reports.'))
        .finally(() => setLoading(false))
    }, [])
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
    <ThemedWatermark />
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <PageHeader icon="chart-bar" title="Reports" subtitle="Sales trends, best sellers, and how customers pay." />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales — Last 14 Days</Text>
        <SalesBars salesOverTime={data.sales_over_time} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top-Selling Items</Text>
        {data.top_items.length === 0 ? (
          <Text style={styles.emptyText}>No completed sales yet.</Text>
        ) : (
          <TopItemsList topItems={data.top_items} />
        )}
      </View>

      <View style={[styles.section, { marginBottom: 30 }]}>
        <Text style={styles.sectionTitle}>Payment Type Breakdown</Text>
        {data.payment_breakdown.length === 0 ? (
          <Text style={styles.emptyText}>No completed sales yet.</Text>
        ) : (
          <PaymentBreakdown breakdown={data.payment_breakdown} />
        )}
      </View>
    </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  errorText: { color: colors.danger },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 14 },
  emptyText: { color: colors.textMuted, fontSize: 13 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 4 },
  barColumn: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barTrack: { width: '70%', height: '85%', justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: colors.primary, borderRadius: 3, minHeight: 4 },
  barLabel: { fontSize: 9, color: colors.textMuted, marginTop: 4 },
  topItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  topItemName: { width: 90, fontSize: 12, color: colors.text, fontWeight: '600' },
  topItemBarTrack: { flex: 1, height: 10, backgroundColor: colors.bg, borderRadius: 5, overflow: 'hidden' },
  topItemBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },
  topItemQty: { width: 28, fontSize: 12, color: colors.textSecondary, textAlign: 'right' },
  paymentLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  paymentLabel: { flex: 1, fontSize: 13, color: colors.text, textTransform: 'capitalize' },
  paymentValue: { fontSize: 13, fontWeight: '700', color: colors.text },
  paymentTrack: { height: 8, backgroundColor: colors.bg, borderRadius: 4, overflow: 'hidden' },
  paymentFill: { height: '100%', borderRadius: 4 },
})
