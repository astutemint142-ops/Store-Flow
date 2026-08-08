import { useCallback, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Modal } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { apiFetch } from '../api'
import PageHeader from '../components/PageHeader'
import ThemedWatermark from '../components/ThemedWatermark'
import { colors } from '../theme'

export default function SuperAdminScreen() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const loadTenants = useCallback(() => {
    setLoading(true)
    apiFetch('/admin/tenants')
      .then(setTenants)
      .catch(() => setError('Failed to load businesses.'))
      .finally(() => setLoading(false))
  }, [])

  useFocusEffect(useCallback(() => { loadTenants() }, [loadTenants]))

  async function toggleStatus(tenant) {
    setError('')
    setBusyId(tenant.id)
    const action = tenant.status === 'active' ? 'suspend' : 'reactivate'
    try {
      await apiFetch(`/admin/tenants/${tenant.id}/${action}`, { method: 'PATCH' })
      loadTenants()
    } catch (err) {
      setError(err.data?.message || 'Failed to update business status.')
    } finally {
      setBusyId(null)
    }
  }

  function openDeleteModal(tenant) {
    setDeleteTarget(tenant)
    setConfirmText('')
    setDeleteError('')
  }

  function closeDeleteModal() {
    setDeleteTarget(null)
    setConfirmText('')
    setDeleteError('')
  }

  async function handleDelete() {
    if (!deleteTarget || confirmText !== deleteTarget.business_name) return
    setDeleting(true)
    setDeleteError('')
    try {
      await apiFetch(`/admin/tenants/${deleteTarget.id}`, { method: 'DELETE' })
      closeDeleteModal()
      loadTenants()
    } catch (err) {
      setDeleteError(err.data?.message || 'Failed to delete business.')
    } finally {
      setDeleting(false)
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
      contentContainerStyle={{ padding: 16 }}
      data={tenants}
      keyExtractor={(t) => String(t.id)}
      ListHeaderComponent={
        <View style={{ marginBottom: 8 }}>
          <PageHeader icon="domain" title="Businesses" subtitle="Every business registered on StoreFlow." />
          <Text style={styles.subtitle}>
            Every business registered on StoreFlow. You can suspend/reactivate an account, but never see a
            business's actual store data.
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No businesses registered yet.</Text>}
      renderItem={({ item: tenant }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.businessName}>{tenant.business_name}</Text>
            <Text style={tenant.status === 'active' ? styles.badgeSuccess : styles.badgeDanger}>{tenant.status}</Text>
          </View>
          <Text style={styles.ownerName}>{tenant.owner_name}</Text>
          <Text style={styles.ownerEmail}>{tenant.owner_email}</Text>
          <Text style={styles.staffCount}>{tenant.users_count} staff account(s)</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[tenant.status === 'active' ? styles.suspendButton : styles.reactivateButton, { flex: 1 }]}
              onPress={() => toggleStatus(tenant)}
              disabled={busyId === tenant.id}
            >
              <Text style={tenant.status === 'active' ? styles.suspendButtonText : styles.reactivateButtonText}>
                {busyId === tenant.id ? 'Updating...' : tenant.status === 'active' ? 'Suspend' : 'Reactivate'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => openDeleteModal(tenant)}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />

    <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={closeDeleteModal}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {deleteTarget && (
            <>
              <Text style={styles.modalTitle}>Permanently delete "{deleteTarget.business_name}"?</Text>
              <Text style={styles.modalBody}>
                This cannot be undone. Every item, category, order, customer, purchase, due reminder, and staff
                account (including <Text style={{ fontWeight: '800' }}>{deleteTarget.owner_email}</Text>) belonging
                to this business will be permanently removed — the email will become free to register again.
              </Text>
              <Text style={styles.modalLabel}>
                Type <Text style={{ fontWeight: '800' }}>{deleteTarget.business_name}</Text> to confirm:
              </Text>
              <TextInput
                style={styles.modalInput}
                value={confirmText}
                onChangeText={setConfirmText}
                autoFocus
                autoCapitalize="none"
              />
              {deleteError ? <Text style={styles.error}>{deleteError}</Text> : null}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancelButton} onPress={closeDeleteModal}>
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalDeleteButton,
                    (confirmText !== deleteTarget.business_name || deleting) && styles.modalDeleteButtonDisabled,
                  ]}
                  onPress={handleDelete}
                  disabled={confirmText !== deleteTarget.business_name || deleting}
                >
                  <Text style={styles.modalDeleteButtonText}>{deleting ? 'Deleting...' : 'Permanently Delete'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  error: { color: colors.danger, fontSize: 13 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 20 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  businessName: { fontSize: 15, fontWeight: '800', color: colors.text, flex: 1 },
  ownerName: { fontSize: 13, fontWeight: '600', color: colors.text },
  ownerEmail: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
  staffCount: { fontSize: 12, color: colors.textSecondary, marginBottom: 12 },
  badgeSuccess: {
    backgroundColor: colors.successLight,
    color: colors.success,
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
    textTransform: 'capitalize',
  },
  suspendButton: { borderWidth: 1, borderColor: colors.danger, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  suspendButtonText: { color: colors.danger, fontWeight: '700' },
  reactivateButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  reactivateButtonText: { color: '#fff', fontWeight: '700' },
  deleteButton: {
    width: 42,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.danger, marginBottom: 8 },
  modalBody: { fontSize: 12.5, color: colors.textSecondary, marginBottom: 14, lineHeight: 18 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.bg,
    color: colors.text,
    marginBottom: 8,
  },
  modalButtons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  modalCancelButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  modalCancelButtonText: { color: colors.textSecondary, fontWeight: '700' },
  modalDeleteButton: { flex: 1, backgroundColor: colors.danger, borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  modalDeleteButtonDisabled: { opacity: 0.5 },
  modalDeleteButtonText: { color: '#fff', fontWeight: '700' },
})
