import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { apiFetch } from '../api'
import PageHeader from '../components/PageHeader'
import ThemedWatermark from '../components/ThemedWatermark'
import QuickDateFilter, { presetToRange } from '../components/QuickDateFilter'
import { formatCurrency } from '../currency'
import { colors } from '../theme'

function formatDate(isoString) {
  return isoString.split('T')[0]
}

export default function DueReminderHistoryScreen() {
  const [dues, setDues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clearingId, setClearingId] = useState(null)
  const [preset, setPreset] = useState('all')
  const [q, setQ] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const { dateFrom, dateTo } = presetToRange(preset)
    const params = new URLSearchParams()
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (q) params.set('q', q)

    apiFetch(`/due-reminders?${params.toString()}`)
      .then(setDues)
      .catch(() => setError('Failed to load due reminders.'))
      .finally(() => setLoading(false))
  }, [preset, q])

  useFocusEffect(useCallback(() => { load() }, [load]))

  async function handleClearDue(dueId) {
    setError('')
    setClearingId(dueId)
    try {
      await apiFetch(`/due-reminders/${dueId}/clear`, { method: 'PATCH' })
      load()
    } catch (err) {
      setError(err.data?.message || 'Failed to clear due.')
    } finally {
      setClearingId(null)
    }
  }

  return (
    <View style={styles.container}>
      <ThemedWatermark />
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        data={dues}
        keyExtractor={(due) => String(due.id)}
        ListHeaderComponent={
          <View style={{ marginBottom: 8 }}>
            <PageHeader icon="alert-outline" title="Due Reminders" subtitle="Every credit due, searchable by date or customer." />
            <QuickDateFilter preset={preset} onPresetChange={setPreset} q={q} onQChange={setQ} searchPlaceholder="Search by customer name or phone..." />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />}
          </View>
        }
        ListEmptyComponent={!loading && <Text style={styles.empty}>No dues match these filters.</Text>}
        renderItem={({ item: due }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.rowTitle}>{due.customer.name}</Text>
              <Text style={due.reminder_status === 'cleared' ? styles.badgeSuccess : styles.badgeWarning}>
                {due.reminder_status}
              </Text>
            </View>
            <Text style={styles.rowSubtitle}>{due.customer.phone} · {formatCurrency(due.amount)}</Text>
            <Text style={styles.rowSubtitle}>Next reminder: {formatDate(due.next_reminder_date)}</Text>
            {due.reminder_status !== 'cleared' && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => handleClearDue(due.id)}
                disabled={clearingId === due.id}
              >
                <Text style={styles.clearButtonText}>{clearingId === due.id ? 'Clearing...' : 'Clear'}</Text>
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
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badgeSuccess: {
    backgroundColor: colors.successLight,
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  badgeWarning: {
    backgroundColor: colors.warningLight,
    color: colors.warning,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  clearButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  clearButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
})
