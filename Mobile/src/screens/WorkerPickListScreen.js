import { useCallback, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { apiFetch } from '../api'
import PageHeader from '../components/PageHeader'
import ThemedWatermark from '../components/ThemedWatermark'
import { formatDateTime } from '../datetime'
import { colors } from '../theme'

const ACTIVE_STATUSES = ['placed', 'picking']
const POLL_INTERVAL_MS = 6000

function sortOrders(list) {
  return [...list].sort((a, b) => (b.is_urgent - a.is_urgent) || (a.id - b.id))
}

export default function WorkerPickListScreen() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmingId, setConfirmingId] = useState(null)
  const intervalRef = useRef(null)

  const loadOrders = useCallback((showSpinner = false) => {
    if (showSpinner) setLoading(true)
    apiFetch('/orders')
      .then((data) => {
        const active = data.filter((o) => ACTIVE_STATUSES.includes(o.order_status))
        setOrders(sortOrders(active))
      })
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadOrders(true)
      intervalRef.current = setInterval(() => loadOrders(false), POLL_INTERVAL_MS)
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }, [loadOrders])
  )

  async function toggleCollected(order, orderItem) {
    setError('')
    try {
      const updatedOrder = await apiFetch(`/orders/${order.id}/items/${orderItem.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_collected: !orderItem.is_collected }),
      })

      setOrders((prev) => sortOrders(prev.map((o) => (o.id === order.id ? updatedOrder : o))))
    } catch {
      setError('Failed to update item. Please try again.')
    }
  }

  async function confirmReady(order) {
    setError('')
    setConfirmingId(order.id)
    try {
      await apiFetch(`/orders/${order.id}/confirm-ready`, { method: 'PATCH' })
      setOrders((prev) => prev.filter((o) => o.id !== order.id))
    } catch (err) {
      setError(err.data?.message || 'Failed to confirm this order as ready.')
    } finally {
      setConfirmingId(null)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

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
          <PageHeader icon="clipboard-list-outline" title="Pick List" subtitle="Collect items for pending orders." />
          <Text style={styles.subtitle}>
            New orders appear here automatically. Tick each item off as you collect it — once
            everything is ticked, do a final crosscheck and confirm the order as ready.
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No pending orders right now.</Text>}
      renderItem={({ item: order }) => {
        const allCollected = order.items.every((oi) => oi.is_collected)
        return (
          <View style={[styles.card, order.is_urgent && styles.cardUrgent]}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderTitle}>Order #{order.id}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {order.is_urgent && <Text style={styles.badgeDanger}>URGENT</Text>}
                <Text style={order.order_status === 'picking' ? styles.badgeWarning : styles.badgeNeutral}>
                  {order.order_status}
                </Text>
              </View>
            </View>
            <Text style={styles.orderTime}>{formatDateTime(order.created_at)}</Text>
            {order.items.map((orderItem) => (
              <TouchableOpacity
                key={orderItem.id}
                style={styles.itemRow}
                onPress={() => toggleCollected(order, orderItem)}
              >
                <View style={[styles.checkbox, orderItem.is_collected && styles.checkboxChecked]}>
                  {orderItem.is_collected && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={[styles.itemText, orderItem.is_collected && styles.itemTextCollected]}>
                  {orderItem.item.name} × {orderItem.quantity}
                </Text>
              </TouchableOpacity>
            ))}

            {allCollected && (
              <View style={styles.confirmBox}>
                <Text style={styles.confirmHint}>Everything's ticked — do a quick crosscheck, then confirm:</Text>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => confirmReady(order)}
                  disabled={confirmingId === order.id}
                >
                  <Text style={styles.confirmButtonText}>
                    {confirmingId === order.id ? 'Confirming...' : 'Review & Confirm Ready'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )
      }}
    />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  error: { color: colors.danger, fontSize: 13 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 20 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardUrgent: { borderWidth: 2, borderColor: colors.danger },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  orderTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  orderTime: { fontSize: 11, color: colors.textMuted, marginBottom: 8 },
  badgeWarning: {
    backgroundColor: colors.warningLight,
    color: colors.warning,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    textTransform: 'capitalize',
  },
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxMark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  itemText: { fontSize: 14, color: colors.text },
  itemTextCollected: { color: colors.textMuted, textDecorationLine: 'line-through' },
  confirmBox: { marginTop: 10, padding: 10, backgroundColor: colors.primaryLight, borderRadius: 8 },
  confirmHint: { fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 8 },
  confirmButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontWeight: '700' },
})
