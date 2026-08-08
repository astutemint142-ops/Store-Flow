import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../theme'

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
]

function isoDate(date) {
  return date.toISOString().slice(0, 10)
}

export function presetToRange(preset) {
  const today = new Date()
  if (preset === 'today') {
    const d = isoDate(today)
    return { dateFrom: d, dateTo: d }
  }
  if (preset === 'week') {
    const start = new Date(today)
    start.setDate(start.getDate() - 6)
    return { dateFrom: isoDate(start), dateTo: isoDate(today) }
  }
  if (preset === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    return { dateFrom: isoDate(start), dateTo: isoDate(today) }
  }
  return { dateFrom: '', dateTo: '' }
}

export default function QuickDateFilter({ preset, onPresetChange, q, onQChange, showSearch = true, searchPlaceholder = 'Search by name or number...' }) {
  return (
    <View style={styles.container}>
      <View style={styles.presetRow}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p.key}
            onPress={() => onPresetChange(p.key)}
            style={[styles.presetButton, preset === p.key && styles.presetButtonActive]}
          >
            <Text style={[styles.presetButtonText, preset === p.key && styles.presetButtonTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {showSearch && (
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={q}
            onChangeText={onQChange}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textMuted}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  presetButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.surface,
  },
  presetButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetButtonText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  presetButtonTextActive: { color: '#fff' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 13, color: colors.text },
})
