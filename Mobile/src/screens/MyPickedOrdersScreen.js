import { useCallback, useState } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { apiFetch } from '../api'
import PageHeader from '../components/PageHeader'
import ThemedWatermark from '../components/ThemedWatermark'
import QuickDateFilter, { presetToRange } from '../components/QuickDateFilter'
import { formatCurrency } from '../currency'
import { formatDateTime } from '../datetime'
import { colors } from '../theme'

function isToday(isoString) {
  return isoString.slice(0, 10) === new Date().toISOString().slice(0, 10)
}

export default function MyPickedOrdersScreen() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [preset, setPreset] = useState('all')
  const [q, setQ] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const { dateFrom, dateTo } = presetToRange(preset)
    const params = new URLSearchParams()
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (q) params.set('q', q)

    apiFetch(`/orders?${params.toString()}`)
      .then(setOrders)
      .catch(() => setError('Failed to load your orders.'))
      .finally(() => setLoading(false))
  }, [preset, q])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const completedToday = orders.filter((o) => o.order_status === 'completed' && isToday(o.updated_at ?? o.created_at)).length

  return (
    <View style={styles.container}>
      <ThemedWatermark />
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        data={orders}
        keyExtractor={(order) => String(order.id)}
        ListHeaderComponent={
          <View style={{ marginBottom: 8 }}>
            <PageHeader icon="package-variant-closed" title="My Orders" subtitle="Every order that has ever been assigned to you." />
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Picked</Text>
                <Text style={styles.statValue}>{orders.length}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Completed Today</Text>
                <Text style={styles.statValue}>{completedToday}</Text>
              </View>
            </View>
            <QuickDateFilter preset={preset} onPresetChange={setPreset} q={q} onQChange={setQ} searchPlaceholder="Search by customer or order #..." />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />}
          </View>
        }
        ListEmptyComponent={!loading && <Text style={styles.empty}>No orders match these filters.</Text>}
        renderItem={({ item: order }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderTitle}>Order #{order.id}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {order.is_urgent && <Text style={styles.badgeDanger}>URGENT</Text>}
                <Text style={styles.badgeNeutral}>{order.order_status}</Text>
              </View>
            </View>
            <Text style={styles.rowSubtitle}>{order.customer?.name}</Text>
            <Text style={styles.rowSubtitle}>{order.items.map((oi) => oi.item.name).join(', ')}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.totalText}>{formatCurrency(order.total_amount)}</Text>
              <Text style={styles.timeText}>{formatDateTime(order.created_at)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  error: { color: colors.danger, fontSize: 13, marginTop: 6 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 20 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: colors.primaryLight, borderRadius: 12, padding: 14 },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 4, color: colors.primary },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  rowSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  totalText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  timeText: { fontSize: 11, color: colors.textMuted },
  badgeNeutral: {
    backgroundColor: colors.border,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
  badgeDanger: {
    backgroundColor: colors.dangerLight,
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
})
