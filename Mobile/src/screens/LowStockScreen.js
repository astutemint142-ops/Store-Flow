import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { apiFetch } from '../api'
import PageHeader from '../components/PageHeader'
import ThemedWatermark from '../components/ThemedWatermark'
import { colors } from '../theme'

export default function LowStockScreen() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadItems = useCallback(() => {
    setLoading(true)
    apiFetch('/items/low-stock')
      .then(setItems)
      .catch(() => setError('Failed to load low-stock items.'))
      .finally(() => setLoading(false))
  }, [])

  useFocusEffect(useCallback(() => { loadItems() }, [loadItems]))

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
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View>
            <PageHeader
              icon="alert-outline"
              title="Low Stock Alerts"
              subtitle="Items at or below their low-stock threshold."
            />
            <View style={styles.headerRow}>
              <Text style={styles.headerText}>
                Consider recording a purchase to top these up.
              </Text>
              <TouchableOpacity onPress={loadItems} style={styles.refreshButton}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Nothing is low on stock right now.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.lowBadge}>{item.stock_quantity} left</Text>
            </View>
            <Text style={styles.itemCategory}>{item.category?.name}</Text>
            <Text style={styles.itemDetail}>Threshold: {item.low_stock_threshold}</Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  refreshButton: { paddingHorizontal: 10, paddingVertical: 6 },
  refreshButtonText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  error: { color: colors.danger, marginBottom: 10, fontSize: 13 },
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
  itemCategory: { fontSize: 12, color: colors.textMuted, marginTop: 2, marginBottom: 4 },
  itemDetail: { fontSize: 13, color: colors.textSecondary },
})
