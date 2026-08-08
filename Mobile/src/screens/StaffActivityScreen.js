import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { apiFetch } from '../api'
import PageHeader from '../components/PageHeader'
import ThemedWatermark from '../components/ThemedWatermark'
import QuickDateFilter, { presetToRange } from '../components/QuickDateFilter'
import { formatCurrency } from '../currency'
import { colors } from '../theme'

function StaffRow({ name, email, right }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName}>{name}</Text>
        <Text style={styles.rowEmail}>{email}</Text>
      </View>
      {right}
    </View>
  )
}

export default function StaffActivityScreen() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [preset, setPreset] = useState('all')

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      const { dateFrom, dateTo } = presetToRange(preset)
      const params = new URLSearchParams()
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)

      apiFetch(`/reports/staff-activity?${params.toString()}`)
        .then(setStaff)
        .catch(() => setError('Failed to load staff activity.'))
        .finally(() => setLoading(false))
    }, [preset])
  )

  if (loading && staff.length === 0) {
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

  const counterStaff = staff.filter((s) => s.role === 'counter_staff')
  const storeWorkers = staff.filter((s) => s.role === 'store_worker')

  return (
    <View style={styles.container}>
      <ThemedWatermark />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <PageHeader icon="chart-timeline-variant" title="Staff Activity" subtitle="How much work each staff member has handled." />

        <QuickDateFilter preset={preset} onPresetChange={setPreset} showSearch={false} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Counter Staff</Text>
          {counterStaff.length === 0 ? (
            <Text style={styles.emptyText}>No counter staff accounts yet.</Text>
          ) : (
            counterStaff.map((s) => (
              <StaffRow
                key={s.id}
                name={s.name}
                email={s.email}
                right={
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.statValue}>{s.orders_count} orders</Text>
                    <Text style={styles.statSub}>{formatCurrency(s.total_sales)}</Text>
                  </View>
                }
              />
            ))
          )}
        </View>

        <View style={[styles.section, { marginBottom: 30 }]}>
          <Text style={styles.sectionTitle}>Store Workers</Text>
          {storeWorkers.length === 0 ? (
            <Text style={styles.emptyText}>No store worker accounts yet.</Text>
          ) : (
            storeWorkers.map((s) => (
              <StaffRow
                key={s.id}
                name={s.name}
                email={s.email}
                right={<Text style={styles.statValue}>{s.orders_count} picked</Text>}
              />
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
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 10 },
  emptyText: { color: colors.textMuted, fontSize: 13 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowName: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowEmail: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statValue: { fontSize: 13, fontWeight: '700', color: colors.primary },
  statSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
})
