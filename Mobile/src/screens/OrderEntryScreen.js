import { useCallback, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { apiFetch } from '../api'
import PageHeader from '../components/PageHeader'
import ThemedWatermark from '../components/ThemedWatermark'
import { formatCurrency } from '../currency'
import { colors } from '../theme'

export default function OrderEntryScreen() {
  const [items, setItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState({})
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      apiFetch('/items')
        .then(setItems)
        .catch(() => setError('Failed to load catalog.'))
        .finally(() => setLoading(false))
    }, [])
  )

  const query = searchQuery.trim().toLowerCase()
  const visibleItems = query
    ? items.filter(
        (i) => i.name.toLowerCase().includes(query) || (i.category?.name ?? '').toLowerCase().includes(query)
      )
    : items
  const cartLines = Object.values(cart)
  const total = cartLines.reduce((sum, line) => sum + Number(line.price) * line.quantity, 0)

  function addToCart(item) {
    setCart((prev) => {
      const existingQty = prev[item.id]?.quantity || 0
      if (existingQty >= item.stock_quantity) return prev
      return { ...prev, [item.id]: { id: item.id, name: item.name, price: item.price, quantity: existingQty + 1 } }
    })
  }

  function changeQty(itemId, delta) {
    setCart((prev) => {
      const line = prev[itemId]
      if (!line) return prev
      const item = items.find((i) => i.id === itemId)
      const newQty = line.quantity + delta
      if (newQty <= 0) {
        const { [itemId]: _removed, ...rest } = prev
        return rest
      }
      if (item && newQty > item.stock_quantity) return prev
      return { ...prev, [itemId]: { ...line, quantity: newQty } }
    })
  }

  async function handleConfirm() {
    setError('')
    setSuccessMessage('')

    if (cartLines.length === 0) {
      setError('Cart is empty. Add at least one item.')
      return
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Customer name and phone are required.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        items: cartLines.map((line) => ({ item_id: line.id, quantity: line.quantity })),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        is_urgent: isUrgent,
      }
      const order = await apiFetch('/orders', { method: 'POST', body: JSON.stringify(payload) })
      setCart({})
      setCustomerName('')
      setCustomerPhone('')
      setIsUrgent(false)
      setSuccessMessage(`Order #${order.id} placed! Total: ${formatCurrency(order.total_amount)}`)
    } catch (err) {
      setError(err.data?.errors?.items?.[0] || err.data?.message || 'Failed to place order.')
    } finally {
      setSubmitting(false)
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedWatermark />
      <View style={{ paddingHorizontal: 16 }}>
        <PageHeader icon="cart-plus" title="New Order" subtitle="Pick items as the customer asks — the total updates live." />
      </View>
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Type an item or category — e.g. juice, flour..."
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <FlatList
        data={visibleItems}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        ListEmptyComponent={
          <Text style={styles.empty}>{query ? `No items match "${searchQuery}".` : 'No items in your catalog yet.'}</Text>
        }
        renderItem={({ item }) => {
          const inCartQty = cart[item.id]?.quantity || 0
          const outOfStock = inCartQty >= item.stock_quantity
          return (
            <View style={styles.itemCard}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
              <Text style={styles.itemStock}>In stock: {item.stock_quantity - inCartQty}</Text>
              <TouchableOpacity
                style={[styles.addBtn, outOfStock && styles.addBtnDisabled]}
                onPress={() => addToCart(item)}
                disabled={outOfStock}
              >
                <Text style={styles.addBtnText}>{outOfStock ? 'No stock' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          )
        }}
      />

      <View style={styles.cartPanel}>
        <ScrollView style={{ maxHeight: 160 }}>
          {cartLines.length === 0 ? (
            <Text style={styles.empty}>No items selected yet.</Text>
          ) : (
            cartLines.map((line) => (
              <View key={line.id} style={styles.cartRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName}>{line.name}</Text>
                  <Text style={styles.cartItemPrice}>{formatCurrency(line.price)} each</Text>
                </View>
                <TouchableOpacity onPress={() => changeQty(line.id, -1)} style={styles.qtyButton}>
                  <Text style={styles.qtyButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{line.quantity}</Text>
                <TouchableOpacity onPress={() => changeQty(line.id, 1)} style={styles.qtyButton}>
                  <Text style={styles.qtyButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>

        <View style={{ gap: 6, marginTop: 10, marginBottom: 8 }}>
          <TextInput style={styles.input} placeholder="Customer name" value={customerName} onChangeText={setCustomerName} />
          <TextInput
            style={styles.input}
            placeholder="Customer phone"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
          />
          <Text style={styles.helperText}>We'll send a thank-you text once the order is paid.</Text>
        </View>

        <TouchableOpacity
          style={[styles.urgentToggle, isUrgent && styles.urgentToggleActive]}
          onPress={() => setIsUrgent((v) => !v)}
        >
          <MaterialCommunityIcons
            name={isUrgent ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={18}
            color={isUrgent ? colors.danger : colors.textSecondary}
          />
          <Text style={[styles.urgentToggleText, isUrgent && styles.urgentToggleTextActive]}>
            Urgent — pick this ahead of the queue
          </Text>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} disabled={submitting}>
          <Text style={styles.confirmButtonText}>{submitting ? 'Placing order...' : 'Confirm Order'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: colors.text },
  empty: { color: colors.textMuted, textAlign: 'center', padding: 16 },
  itemCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
  },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.text },
  itemPrice: { fontSize: 15, fontWeight: '800', color: colors.primary, marginTop: 2 },
  itemStock: { fontSize: 11, color: colors.textMuted, marginTop: 2, marginBottom: 8 },
  addBtn: { backgroundColor: colors.accent, borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: colors.border },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  cartPanel: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 14,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  cartItemName: { fontSize: 13, fontWeight: '700', color: colors.text },
  cartItemPrice: { fontSize: 11, color: colors.textMuted },
  qtyButton: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  qtyButtonText: { color: colors.primary, fontWeight: '800' },
  qtyText: { minWidth: 18, textAlign: 'center', fontWeight: '700', color: colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 17, fontWeight: '800', color: colors.primary },
  helperText: { fontSize: 11, color: colors.textMuted },
  urgentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  urgentToggleActive: { backgroundColor: colors.dangerLight, borderColor: colors.danger },
  urgentToggleText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  urgentToggleTextActive: { color: colors.danger },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.bg,
    color: colors.text,
  },
  error: { color: colors.danger, marginTop: 8, fontSize: 13 },
  success: { color: colors.success, marginTop: 8, fontSize: 13 },
  confirmButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  confirmButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
