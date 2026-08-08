import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { apiFetch } from '../api'
import PageHeader from '../components/PageHeader'
import ThemedWatermark from '../components/ThemedWatermark'
import { formatCurrency } from '../currency'
import { formatDateTime } from '../datetime'
import { colors } from '../theme'

function formatDate(isoString) {
  return isoString.split('T')[0]
}

function StatCard({ label, value, color, bg, onPress }) {
  return (
    <TouchableOpacity style={[styles.statCard, { backgroundColor: bg }]} onPress={onPress}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </TouchableOpacity>
  )
}

export default function OwnerDashboardScreen({ navigation }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clearingId, setClearingId] = useState(null)

  const loadSummary = useCallback(() => {
    setLoading(true)
    apiFetch('/dashboard/summary')
      .then(setSummary)
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  useFocusEffect(useCallback(() => { loadSummary() }, [loadSummary]))

  async function handleClearDue(dueId) {
    setError('')
    setClearingId(dueId)
    try {
      await apiFetch(`/due-reminders/${dueId}/clear`, { method: 'PATCH' })
      loadSummary()
    } catch (err) {
      setError(err.data?.message || 'Failed to clear due.')
    } finally {
      setClearingId(null)
    }
  }

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
      <PageHeader icon="view-dashboard-outline" title="Owner Dashboard" subtitle="A quick look at how the store is doing today." />
      <View style={styles.statsGrid}>
        <StatCard
          label="Today's Sales"
          value={formatCurrency(summary.todays_sales_total)}
          color={colors.primary}
          bg={colors.primaryLight}
          onPress={() => navigation.navigate('OrdersHistory', { mode: 'all' })}
        />
        <StatCard
          label="Today's Orders"
          value={summary.todays_orders_count}
          color={colors.accent}
          bg="#FCE9DE"
          onPress={() => navigation.navigate('OrdersHistory', { mode: 'all' })}
        />
        <StatCard
          label="Low Stock Items"
          value={summary.low_stock_items.length}
          color={colors.warning}
          bg={colors.warningLight}
          onPress={() => navigation.navigate('LowStock')}
        />
        <StatCard
          label="Pending Dues"
          value={summary.pending_dues_count}
          color={colors.blush}
          bg="#F7E6EB"
          onPress={() => navigation.navigate('DueReminderHistory')}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Today's Orders (most recent)</Text>
          <TouchableOpacity onPress={() => navigation.navigate('OrdersHistory', { mode: 'all' })}>
            <Text style={styles.viewAllLink}>View all →</Text>
          </TouchableOpacity>
        </View>
        {summary.todays_orders.length === 0 ? (
          <Text style={styles.emptyText}>No orders placed today yet.</Text>
        ) : (
          summary.todays_orders.map((order) => (
            <View key={order.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Order #{order.id}</Text>
                <Text style={styles.rowSubtitle}>{order.items.map((oi) => oi.item.name).join(', ')}</Text>
                <Text style={styles.rowSubtitle}>{formatDateTime(order.created_at)}</Text>
              </View>
              <Text style={styles.rowAmount}>{formatCurrency(order.total_amount)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
        {summary.low_stock_items.length === 0 ? (
          <Text style={styles.emptyText}>Nothing is low on stock right now.</Text>
        ) : (
          summary.low_stock_items.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={styles.lowBadge}>{item.stock_quantity} left</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pending Dues (most recent)</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DueReminderHistory')}>
            <Text style={styles.viewAllLink}>View all →</Text>
          </TouchableOpacity>
        </View>
        {summary.pending_dues.length === 0 ? (
          <Text style={styles.emptyText}>No pending dues right now.</Text>
        ) : (
          summary.pending_dues.map((due) => (
            <View key={due.id} style={styles.dueRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{due.customer.name}</Text>
                <Text style={styles.rowSubtitle}>{due.customer.phone} · {formatCurrency(due.amount)}</Text>
                <Text style={styles.rowSubtitle}>Next reminder: {formatDate(due.next_reminder_date)}</Text>
              </View>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => handleClearDue(due.id)}
                disabled={clearingId === due.id}
              >
                <Text style={styles.clearButtonText}>{clearingId === due.id ? 'Clearing...' : 'Clear'}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={[styles.section, { marginBottom: 30 }]}>
        <Text style={styles.sectionTitle}>Reminder History</Text>
        {summary.recent_reminders.length === 0 ? (
          <Text style={styles.emptyText}>No reminders sent yet.</Text>
        ) : (
          summary.recent_reminders.map((log) => (
            <View key={log.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{log.due_reminder?.customer?.name ?? '—'}</Text>
                <Text style={styles.rowSubtitle}>
                  {log.channel.toUpperCase()} · {formatDate(log.sent_at)}
                </Text>
              </View>
              <Text style={log.status === 'sent' ? styles.sentBadge : styles.failedBadge}>{log.status}</Text>
            </View>
          ))
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { flexBasis: '47%', flexGrow: 1, borderRadius: 12, padding: 14 },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  viewAllLink: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  emptyText: { color: colors.textMuted, fontSize: 13 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rowAmount: { fontSize: 14, fontWeight: '700', color: colors.primary },
  lowBadge: {
    backgroundColor: colors.dangerLight,
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  sentBadge: {
    backgroundColor: colors.successLight,
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  failedBadge: {
    backgroundColor: colors.dangerLight,
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  clearButton: { backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 7 },
  clearButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
})
