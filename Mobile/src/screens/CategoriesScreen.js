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
import { apiFetch } from '../api'
import PageHeader from '../components/PageHeader'
import ThemedWatermark from '../components/ThemedWatermark'
import { colors } from '../theme'

export default function CategoriesScreen() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadCategories = useCallback(() => {
    setLoading(true)
    apiFetch('/categories')
      .then(setCategories)
      .catch(() => setError('Failed to load categories.'))
      .finally(() => setLoading(false))
  }, [])

  useFocusEffect(useCallback(() => { loadCategories() }, [loadCategories]))

  async function handleAdd() {
    if (!newName.trim()) return
    setError('')
    setSubmitting(true)
    try {
      await apiFetch('/categories', { method: 'POST', body: JSON.stringify({ name: newName }) })
      setNewName('')
      loadCategories()
    } catch (err) {
      setError(err.data?.message || 'Failed to add category.')
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(category) {
    setEditingId(category.id)
    setEditingName(category.name)
  }

  async function handleSaveEdit() {
    setError('')
    try {
      await apiFetch(`/categories/${editingId}`, { method: 'PUT', body: JSON.stringify({ name: editingName }) })
      setEditingId(null)
      loadCategories()
    } catch (err) {
      setError(err.data?.message || 'Failed to update category.')
    }
  }

  function handleDelete(category) {
    Alert.alert('Delete category?', `Are you sure you want to delete "${category.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch(`/categories/${category.id}`, { method: 'DELETE' })
            loadCategories()
          } catch (err) {
            setError(err.data?.message || 'Failed to delete category.')
          }
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <ThemedWatermark />
      <PageHeader icon="tag-multiple-outline" title="Categories" subtitle="Organize your catalog into groups." />
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="New category name"
          value={newName}
          onChangeText={setNewName}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={submitting}>
          <Text style={styles.addButtonText}>{submitting ? '...' : 'Add'}</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.empty}>No categories yet. Add one above.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              {editingId === item.id ? (
                <>
                  <TextInput
                    style={[styles.input, styles.editInput]}
                    value={editingName}
                    onChangeText={setEditingName}
                  />
                  <TouchableOpacity onPress={handleSaveEdit} style={styles.smallButton}>
                    <Text style={styles.smallButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingId(null)} style={styles.smallButtonGhost}>
                    <Text style={styles.smallButtonGhostText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.rowText}>{item.name}</Text>
                  <TouchableOpacity onPress={() => startEdit(item)} style={styles.smallButtonGhost}>
                    <Text style={styles.smallButtonGhostText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)} style={styles.smallButtonDanger}>
                    <Text style={styles.smallButtonDangerText}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  editInput: { marginRight: 8 },
  addButton: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 18, justifyContent: 'center' },
  addButtonText: { color: '#fff', fontWeight: '700' },
  error: { color: colors.danger, marginBottom: 10 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  rowText: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  smallButton: { backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6 },
  smallButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  smallButtonGhost: { paddingHorizontal: 10, paddingVertical: 6, marginRight: 6 },
  smallButtonGhostText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  smallButtonDanger: { borderWidth: 1, borderColor: colors.danger, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  smallButtonDangerText: { color: colors.danger, fontWeight: '700', fontSize: 12 },
})
