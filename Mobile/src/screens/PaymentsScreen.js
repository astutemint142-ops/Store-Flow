import { useCallback, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Linking, KeyboardAvoidingView, Platform } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { apiFetch } from '../api'
import PageHeader from '../components/PageHeader'
import ThemedWatermark from '../components/ThemedWatermark'
import { formatCurrency } from '../currency'
import { formatDateTime } from '../datetime'
import { buildWhatsAppReceiptUrl } from '../whatsapp'
import { colors } from '../theme'

const emptyPaymentForm = { payment_type: 'cash', customer_name: '', customer_phone: '' }

export default function PaymentsScreen() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [forms, setForms] = useState({})
  const [submittingId, setSubmittingId] = useState(null)
  const [paidOrders, setPaidOrders] = useState([])

  const loadOrders = useCallback(() => {
    setLoading(true)
    apiFetch('/orders')
      .then((data) => setOrders(data.filter((order) => order.order_status === 'ready')))
      .catch(() => setError('Failed to load orders.'))
      .finally(() => setLoading(false))
  }, [])

  useFocusEffect(useCallback(() => { loadOrders() }, [loadOrders]))

  function formFor(orderId) {
    return forms[orderId] || emptyPaymentForm
  }

  function updateForm(orderId, field, value) {
    setForms((prev) => ({ ...prev, [orderId]: { ...formFor(orderId), [field]: value } }))
  }

  async function handlePay(order) {
    setError('')
    const form = formFor(order.id)

    if (form.payment_type === 'credit' && !order.customer) {
      if (!form.customer_name.trim() || !form.customer_phone.trim()) {
        setError('Customer name and phone are required for a credit payment.')
        return
      }
    }

    setSubmittingId(order.id)
    try {
      const payload = { payment_type: form.payment_type }
      if (form.payment_type === 'credit' && !order.customer) {
        payload.customer_name = form.customer_name.trim()
        payload.customer_phone = form.customer_phone.trim()
      }
      const paidOrder = await apiFetch(`/orders/${order.id}/pay`, { method: 'PATCH', body: JSON.stringify(payload) })
      setOrders((prev) => prev.filter((o) => o.id !== order.id))
      if (paidOrder.customer?.phone) {
        setPaidOrders((prev) => [paidOrder, ...prev])
      }
    } catch (err) {
      setError(err.data?.message || 'Failed to process payment.')
    } finally {
      setSubmittingId(null)
    }
  }

  function dismissReceipt(orderId) {
    setPaidOrders((prev) => prev.filter((o) => o.id !== orderId))
  }

  function sendReceipt(order) {
    const url = buildWhatsAppReceiptUrl(order, order.customer.phone, order.tenant?.business_name)
    Linking.openURL(url).catch(() => {})
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ThemedWatermark />
    <FlatList
      style={{ flex: 1 }}
      data={orders}
      keyExtractor={(order) => String(order.id)}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <PageHeader icon="cash-multiple" title="Payments" subtitle="Process payment for orders that are ready." />

          {paidOrders.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Send Receipt</Text>
              {paidOrders.map((order) => (
                <View key={order.id} style={styles.receiptCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.receiptTitle}>Order #{order.id} paid</Text>
                    <Text style={styles.receiptSub}>
                      {order.customer.name} · {order.customer.phone}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.whatsappButton} onPress={() => sendReceipt(order)}>
                    <MaterialCommunityIcons name="whatsapp" size={16} color="#fff" />
                    <Text style={styles.whatsappButtonText}>WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => dismissReceipt(order.id)} style={styles.dismissButton} hitSlop={8}>
                    <MaterialCommunityIcons name="close" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.headerRow}>
            <Text style={styles.headerText}>Ready orders waiting for payment</Text>
            <TouchableOpacity onPress={loadOrders} style={styles.refreshButton}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No orders waiting for payment.</Text>}
      renderItem={({ item: order }) => {
        const form = formFor(order.id)
        return (
          <View style={styles.card}>
            <View style={styles.orderHeaderRow}>
              <Text style={styles.orderTitle}>Order #{order.id}</Text>
              <Text style={styles.orderTime}>{formatDateTime(order.created_at)}</Text>
            </View>
            {order.items.map((oi) => (
              <Text key={oi.id} style={styles.orderLine}>• {oi.item.name} × {oi.quantity}</Text>
            ))}
            <Text style={styles.orderTotal}>Total: {formatCurrency(order.total_amount)}</Text>

            <View style={styles.typeRow}>
              {['cash', 'card', 'credit'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeButton, form.payment_type === type && styles.typeButtonActive]}
                  onPress={() => updateForm(order.id, 'payment_type', type)}
                >
                  <Text style={[styles.typeButtonText, form.payment_type === type && styles.typeButtonTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {form.payment_type === 'credit' && !order.customer && (
              <View style={{ gap: 6, marginBottom: 10 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Customer name"
                  value={form.customer_name}
                  onChangeText={(v) => updateForm(order.id, 'customer_name', v)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Customer phone"
                  value={form.customer_phone}
                  onChangeText={(v) => updateForm(order.id, 'customer_phone', v)}
                  keyboardType="phone-pad"
                />
              </View>
            )}

            {form.payment_type === 'credit' && order.customer && (
              <Text style={styles.creditNote}>Credit for: {order.customer.name} ({order.customer.phone})</Text>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.payButton}
              onPress={() => handlePay(order)}
              disabled={submittingId === order.id}
            >
              <Text style={styles.payButtonText}>{submittingId === order.id ? 'Processing...' : 'Mark as Paid'}</Text>
            </TouchableOpacity>
          </View>
        )
      }}
    />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 8 },
  receiptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  receiptTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  receiptSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  whatsappButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  dismissButton: { padding: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  refreshButton: { paddingHorizontal: 10, paddingVertical: 6 },
  refreshButtonText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 20 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  orderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  orderTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  orderTime: { fontSize: 11, color: colors.textMuted },
  orderLine: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  orderTotal: { fontSize: 16, fontWeight: '800', color: colors.primary, marginTop: 8, marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  typeButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  typeButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeButtonText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  typeButtonTextActive: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bg,
    color: colors.text,
  },
  creditNote: { fontSize: 12, color: colors.textSecondary, marginBottom: 10 },
  error: { color: colors.danger, marginBottom: 10, fontSize: 13 },
  payButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  payButtonText: { color: '#fff', fontWeight: '700' },
})
