import { useCallback, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Picker } from '@react-native-picker/picker'
import { apiFetch } from '../api'
import PageHeader from '../components/PageHeader'
import ThemedWatermark from '../components/ThemedWatermark'
import { formatCurrency } from '../currency'
import { formatDateTime } from '../datetime'
import { colors } from '../theme'

export default function PurchaseEntryScreen() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [selectedItemId, setSelectedItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [lines, setLines] = useState([])

  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const loadHistory = useCallback(() => {
    setHistoryLoading(true)
    apiFetch('/purchases')
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [])

  useFocusEffect(
    useCallback(() => {
      apiFetch('/items')
        .then(setItems)
        .catch(() => setError('Failed to load items.'))
        .finally(() => setLoading(false))
      loadHistory()
    }, [loadHistory])
  )

  const total = lines.reduce((sum, line) => sum + line.quantity * line.purchase_price, 0)

  function addLine() {
    setError('')
    const item = items.find((i) => i.id === Number(selectedItemId))
    if (!item || !quantity || !purchasePrice) {
      setError('Select an item and fill in quantity and purchase price.')
      return
    }

    setLines((prev) => [
      ...prev,
      { item_id: item.id, name: item.name, quantity: Number(quantity), purchase_price: Number(purchasePrice) },
    ])
    setSelectedItemId('')
    setQuantity('')
    setPurchasePrice('')
  }

  function removeLine(index) {
    setLines((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    setError('')
    setSuccessMessage('')

    if (lines.length === 0) {
      setError('Add at least one item to the purchase.')
      return
    }

    setSubmitting(true)
    try {
      const purchase = await apiFetch('/purchases', {
        method: 'POST',
        body: JSON.stringify({
          items: lines.map((line) => ({
            item_id: line.item_id,
            quantity: line.quantity,
            purchase_price: line.purchase_price,
          })),
        }),
      })
      setLines([])
      setSuccessMessage(`Purchase #${purchase.id} recorded! Total: ${formatCurrency(purchase.total_amount)}. Stock updated.`)
      loadHistory()
    } catch (err) {
      setError(err.data?.message || 'Failed to record purchase.')
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
    <View style={styles.container}>
    <ThemedWatermark />
    <FlatList
      style={{ flex: 1 }}
      data={lines}
      keyExtractor={(_, index) => String(index)}
      ListHeaderComponent={
        <View style={styles.form}>
          <PageHeader icon="truck-delivery-outline" title="Record Purchase" subtitle="Add stock that just arrived and what you paid." />
          <Text style={styles.label}>Item</Text>
          <View style={styles.pickerBox}>
            <Picker selectedValue={selectedItemId} onValueChange={setSelectedItemId}>
              <Picker.Item label="Select..." value="" />
              {items.map((item) => (
                <Picker.Item key={item.id} label={item.name} value={String(item.id)} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Quantity</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={quantity} onChangeText={setQuantity} />

          <Text style={styles.label}>Purchase Price (per unit)</Text>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={purchasePrice} onChangeText={setPurchasePrice} />

          <TouchableOpacity style={styles.addLineButton} onPress={addLine}>
            <Text style={styles.addLineButtonText}>Add to Purchase</Text>
          </TouchableOpacity>

          {lines.length > 0 && <Text style={styles.sectionTitle}>Purchase Lines</Text>}
        </View>
      }
      renderItem={({ item, index }) => (
        <View style={styles.lineCard}>
          <View style={styles.lineHeader}>
            <Text style={styles.lineName}>{item.name}</Text>
            <TouchableOpacity onPress={() => removeLine(index)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.lineDetail}>
            {item.quantity} x {formatCurrency(item.purchase_price)} = {formatCurrency(item.quantity * item.purchase_price)}
          </Text>
        </View>
      )}
      ListFooterComponent={
        <View>
          {lines.length > 0 && <Text style={styles.total}>Total: {formatCurrency(total)}</Text>}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
          <TouchableOpacity
            style={[styles.submitButton, (submitting || lines.length === 0) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting || lines.length === 0}
          >
            <Text style={styles.submitButtonText}>{submitting ? 'Recording...' : 'Record Purchase'}</Text>
          </TouchableOpacity>

          <Text style={styles.historyTitle}>Recent Purchases</Text>
          {historyLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />
          ) : history.length === 0 ? (
            <Text style={styles.empty}>No purchases recorded yet.</Text>
          ) : (
            history.map((purchase) => (
              <View key={purchase.id} style={styles.historyCard}>
                <View style={styles.historyHeaderRow}>
                  <Text style={styles.historyTitleText}>Purchase #{purchase.id}</Text>
                  <Text style={styles.historyTime}>{formatDateTime(purchase.created_at)}</Text>
                </View>
                <Text style={styles.historyItems}>
                  {purchase.items.map((pi) => `${pi.item.name} × ${pi.quantity}`).join(', ')}
                </Text>
                <Text style={styles.historyTotal}>Total: {formatCurrency(purchase.total_amount)}</Text>
              </View>
            ))
          )}
        </View>
      }
      contentContainerStyle={{ padding: 16 }}
    />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  form: { marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  pickerBox: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface },
  addLineButton: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  addLineButtonText: { color: '#fff', fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 24, marginBottom: 8 },
  lineCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  lineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineName: { fontSize: 15, fontWeight: '700', color: colors.text },
  removeText: { color: colors.danger, fontWeight: '700', fontSize: 12 },
  lineDetail: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  total: { fontSize: 18, fontWeight: '800', color: colors.primary, marginTop: 8, marginBottom: 12 },
  error: { color: colors.danger, marginBottom: 10 },
  success: { color: colors.success, marginBottom: 10 },
  submitButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  historyTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 28, marginBottom: 10 },
  empty: { color: colors.textMuted, fontSize: 13 },
  historyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  historyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  historyTitleText: { fontSize: 14, fontWeight: '700', color: colors.text },
  historyTime: { fontSize: 11, color: colors.textMuted },
  historyItems: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  historyTotal: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 6 },
})
