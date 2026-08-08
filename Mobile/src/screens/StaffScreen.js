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
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Picker } from '@react-native-picker/picker'
import { apiFetch } from '../api'
import PageHeader from '../components/PageHeader'
import ThemedWatermark from '../components/ThemedWatermark'
import PasswordField from '../components/PasswordField'
import { colors } from '../theme'

const emptyForm = { name: '', email: '', password: '', role: 'counter_staff' }

export default function StaffScreen() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const loadStaff = useCallback(() => {
    setLoading(true)
    apiFetch('/staff')
      .then(setStaff)
      .catch(() => setError('Failed to load staff.'))
      .finally(() => setLoading(false))
  }, [])

  useFocusEffect(useCallback(() => { loadStaff() }, [loadStaff]))

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setError('')
    setSuccessMessage('')
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }

    setSubmitting(true)
    try {
      await apiFetch('/staff', { method: 'POST', body: JSON.stringify(form) })
      setForm(emptyForm)
      setSuccessMessage('Staff account created.')
      loadStaff()
    } catch (err) {
      const message = err.data?.errors?.email?.[0] || err.data?.message || 'Failed to create staff account.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleDelete(member) {
    Alert.alert('Remove staff?', `Remove "${member.name}"'s account?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/staff/${member.id}`, { method: 'DELETE' })
            loadStaff()
          } catch (err) {
            setError(err.data?.message || 'Failed to remove staff account.')
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
      data={staff}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <View style={styles.form}>
          <PageHeader icon="account-group-outline" title="Staff" subtitle="Create logins for Counter Staff and Store Workers." />
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={(v) => updateField('name', v)} />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <PasswordField value={form.password} onChangeText={(v) => updateField('password', v)} />

          <Text style={styles.label}>Role</Text>
          <View style={styles.pickerBox}>
            <Picker selectedValue={form.role} onValueChange={(v) => updateField('role', v)}>
              <Picker.Item label="Counter Staff" value="counter_staff" />
              <Picker.Item label="Store Worker" value="store_worker" />
            </Picker>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

          <TouchableOpacity style={styles.addButton} onPress={handleSubmit} disabled={submitting}>
            <Text style={styles.addButtonText}>{submitting ? 'Creating...' : 'Add Staff'}</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Staff Accounts ({staff.length})</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No staff accounts yet. Add one above.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.roleBadge}>{item.role.replace('_', ' ')}</Text>
          </View>
          <Text style={styles.itemEmail}>{item.email}</Text>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.smallButtonDanger}>
            <Text style={styles.smallButtonDangerText}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}
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
  error: { color: colors.danger, marginTop: 10 },
  success: { color: colors.success, marginTop: 10 },
  addButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  addButtonText: { color: '#fff', fontWeight: '700' },
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
  itemEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: 10 },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  smallButtonDanger: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallButtonDangerText: { color: colors.danger, fontWeight: '700', fontSize: 12 },
})
