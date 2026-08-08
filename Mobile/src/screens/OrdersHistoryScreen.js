import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Picker } from '@react-native-picker/picker'
import { apiFetch } from '../api'
import PageHeader from '../components/PageHeader'
import ThemedWatermark from '../components/ThemedWatermark'
import QuickDateFilter, { presetToRange } from '../components/QuickDateFilter'
import { formatCurrency } from '../currency'
import { formatDateTime } from '../datetime'
import { colors } from '../theme'

export default function OrdersHistoryScreen({ navigation, route }) {
  const mode = route?.params?.mode ?? 'all'
  const [orders, setOrders] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [preset, setPreset] = useState('all')
  const [q, setQ] = useState('')
  const [bookedBy, setBookedBy] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const { dateFrom, dateTo } = presetToRange(preset)
    const params = new URLSearchParams()
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (q) params.set('q', q)
    if (mode === 'mine') {
      params.set('created_by', 'me')
    } else if (bookedBy) {
      params.set('created_by', bookedBy)
    }

    apiFetch(`/orders?${params.toString()}`)
      .then(setOrders)
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))
  }, [preset, q, bookedBy, mode])

  useFocusEffect(useCallback(() => { load() }, [load]))

  useFocusEffect(
    useCallback(() => {
      if (mode === 'all') {
        apiFetch('/staff')
          .then((data) => setStaff(data.filter((s) => s.role === 'counter_staff')))
          .catch(() => {})
      }
    }, [mode])
  )

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
            <PageHeader
              icon="history"
              title={mode === 'mine' ? 'My Orders' : 'Order History'}
              subtitle={mode === 'mine' ? 'Every order you have booked.' : 'Every order ever placed.'}
            />
            <QuickDateFilter preset={preset} onPresetChange={setPreset} q={q} onQChange={setQ} searchPlaceholder="Search by customer or order #..." />
            {mode === 'all' && (
              <View style={styles.pickerBox}>
                <Picker selectedValue={bookedBy} onValueChange={setBookedBy}>
                  <Picker.Item label="All Counter Staff" value="" />
                  {staff.map((s) => (
                    <Picker.Item key={s.id} label={s.name} value={String(s.id)} />
                  ))}
                </Picker>
              </View>
            )}
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
            <Text style={styles.rowSubtitle}>{order.customer?.name} · {order.customer?.phone}</Text>
            <Text style={styles.rowSubtitle}>{order.items.map((oi) => oi.item.name).join(', ')}</Text>
            {mode === 'all' && <Text style={styles.rowSubtitle}>Booked by: {order.creator?.name ?? '—'}</Text>}
            <View style={styles.cardFooter}>
              <Text style={styles.totalText}>{formatCurrency(order.total_amount)}</Text>
              <Text style={styles.timeText}>{formatDateTime(order.created_at)}</Text>
            </View>
            {['placed', 'picking'].includes(order.order_status) && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('OrderEdit', { order })}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
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
  pickerBox: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface, marginBottom: 4 },
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
  editButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
})
