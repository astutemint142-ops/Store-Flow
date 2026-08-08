import { useCallback, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Picker } from '@react-native-picker/picker'
import * as DocumentPicker from 'expo-document-picker'
import { apiFetch } from '../api'
import PageHeader from '../components/PageHeader'
import ThemedWatermark from '../components/ThemedWatermark'
import { formatCurrency } from '../currency'
import { colors } from '../theme'

const emptyForm = {
  category_id: '',
  name: '',
  price: '',
  purchase_price: '',
  stock_quantity: '',
  low_stock_threshold: '',
}

export default function ItemsScreen() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importError, setImportError] = useState('')

  const loadData = useCallback(() => {
    setLoading(true)
    Promise.all([apiFetch('/items'), apiFetch('/categories')])
      .then(([itemsData, categoriesData]) => {
        setItems(itemsData)
        setCategories(categoriesData)
      })
      .catch(() => setError('Failed to load items.'))
      .finally(() => setLoading(false))
  }, [])

  useFocusEffect(useCallback(() => { loadData() }, [loadData]))

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function startEdit(item) {
    setEditingId(item.id)
    setForm({
      category_id: String(item.category_id),
      name: item.name,
      price: String(item.price),
      purchase_price: String(item.purchase_price),
      stock_quantity: String(item.stock_quantity),
      low_stock_threshold: String(item.low_stock_threshold),
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit() {
    setError('')
    if (!form.category_id || !form.name || !form.price || !form.purchase_price || !form.stock_quantity || !form.low_stock_threshold) {
      setError('Please fill in all fields.')
      return
    }

    const payload = {
      category_id: Number(form.category_id),
      name: form.name,
      price: Number(form.price),
      purchase_price: Number(form.purchase_price),
      stock_quantity: Number(form.stock_quantity),
      low_stock_threshold: Number(form.low_stock_threshold),
    }

    setSubmitting(true)
    try {
      if (editingId) {
        await apiFetch(`/items/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/items', { method: 'POST', body: JSON.stringify(payload) })
      }
      cancelEdit()
      loadData()
    } catch (err) {
      setError(err.data?.message || 'Failed to save item.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleImport() {
    setImportError('')
    setImportResult(null)

    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/comma-separated-values',
      ],
      copyToCacheDirectory: true,
    })
    if (result.canceled || !result.assets?.[0]) return

    const asset = result.assets[0]
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', {
        uri: asset.uri,
        name: asset.name || 'items.xlsx',
        type: asset.mimeType || 'application/octet-stream',
      })

      const response = await apiFetch('/items/import', { method: 'POST', body: formData })
      setImportResult(response)
      loadData()
    } catch (err) {
      setImportError(err.data?.message || 'Failed to import file.')
    } finally {
      setImporting(false)
    }
  }

  function handleDelete(item) {
    Alert.alert('Delete item?', `Are you sure you want to delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/items/${item.id}`, { method: 'DELETE' })
            loadData()
          } catch (err) {
            setError(err.data?.message || 'Failed to delete item.')
          }
        },
      },
    ])
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
      data={items}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View style={styles.form}>
          <PageHeader icon="basket-outline" title="Items" subtitle="Manage your catalog, pricing, and stock." />

          <View style={styles.importBox}>
            <TouchableOpacity style={styles.importButton} onPress={handleImport} disabled={importing}>
              <Text style={styles.importButtonText}>
                {importing ? 'Importing...' : 'Import from Excel/CSV'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.importHint}>
              Columns: Category, Name, Price, Purchase Price, Stock Quantity, Low Stock Threshold
            </Text>
            {importError ? <Text style={styles.error}>{importError}</Text> : null}
            {importResult && (
              <View>
                <Text style={styles.importSuccess}>
                  {importResult.created} item(s) added, {importResult.updated} updated.
                </Text>
                {importResult.errors?.map((err, i) => (
                  <Text key={i} style={styles.error}>{err}</Text>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerBox}>
            <Picker selectedValue={form.category_id} onValueChange={(v) => updateField('category_id', v)}>
              <Picker.Item label="Select..." value="" />
              {categories.map((c) => (
                <Picker.Item key={c.id} label={c.name} value={String(c.id)} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={(v) => updateField('name', v)} />

          <Text style={styles.label}>Price</Text>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={form.price} onChangeText={(v) => updateField('price', v)} />

          <Text style={styles.label}>Purchase Price</Text>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={form.purchase_price} onChangeText={(v) => updateField('purchase_price', v)} />

          <Text style={styles.label}>Stock Quantity</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={form.stock_quantity} onChangeText={(v) => updateField('stock_quantity', v)} />

          <Text style={styles.label}>Low Stock Alert At</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={form.low_stock_threshold} onChangeText={(v) => updateField('low_stock_threshold', v)} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.addButton} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.addButtonText}>{submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add Item'}</Text>
            </TouchableOpacity>
            {editingId && (
              <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.sectionTitle}>Catalog ({items.length})</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No items yet. Add one above.</Text>}
      renderItem={({ item }) => {
        const isLow = item.stock_quantity <= item.low_stock_threshold
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.itemName}>{item.name}</Text>
              {isLow && <Text style={styles.lowBadge}>Low</Text>}
            </View>
            <Text style={styles.itemCategory}>{item.category?.name}</Text>
            <View style={styles.itemRow}>
              <Text style={styles.itemDetail}>Price: {formatCurrency(item.price)}</Text>
              <Text style={styles.itemDetail}>Cost: {formatCurrency(item.purchase_price)}</Text>
            </View>
            <View style={styles.itemRow}>
              <Text style={styles.itemDetail}>Stock: {item.stock_quantity}</Text>
              <Text style={styles.itemDetail}>Alert at: {item.low_stock_threshold}</Text>
            </View>
            <View style={styles.cardButtons}>
              <TouchableOpacity onPress={() => startEdit(item)} style={styles.smallButtonGhost}>
                <Text style={styles.smallButtonGhostText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item)} style={styles.smallButtonDanger}>
                <Text style={styles.smallButtonDangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      }}
      contentContainerStyle={{ padding: 16 }}
    />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  form: { marginBottom: 8 },
  importBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  importButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  importButtonText: { color: '#fff', fontWeight: '700' },
  importHint: { fontSize: 11, color: colors.textMuted, marginTop: 8 },
  importSuccess: { color: colors.success ?? colors.primary, fontSize: 12, marginTop: 8, fontWeight: '600' },
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
  error: { color: colors.danger, marginTop: 10 },
  formButtons: { flexDirection: 'row', gap: 8, marginTop: 16 },
  addButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: '700' },
  cancelButton: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' },
  cancelButtonText: { color: colors.textSecondary, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 24, marginBottom: 8 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 20 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemName: { fontSize: 16, fontWeight: '700', color: colors.text },
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
  itemCategory: { fontSize: 12, color: colors.textMuted, marginTop: 2, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemDetail: { fontSize: 13, color: colors.textSecondary },
  cardButtons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  smallButtonGhost: { paddingHorizontal: 10, paddingVertical: 6 },
  smallButtonGhostText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  smallButtonDanger: { borderWidth: 1, borderColor: colors.danger, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  smallButtonDangerText: { color: colors.danger, fontWeight: '700', fontSize: 12 },
})
