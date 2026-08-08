import { useCallback, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { getApiBaseUrl, setApiBaseUrl, getSavedServers, addSavedServer, deleteSavedServer } from '../api'
import { DEFAULT_API_BASE_URL } from '../config'
import { colors } from '../theme'

export default function ApiSettingsScreen({ navigation }) {
  const [servers, setServers] = useState([])
  const [activeUrl, setActiveUrl] = useState('')
  const [loading, setLoading] = useState(true)

  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [switchingId, setSwitchingId] = useState(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadAll = useCallback(() => {
    setLoading(true)
    Promise.all([getSavedServers(), getApiBaseUrl()]).then(([savedServers, current]) => {
      setServers(savedServers)
      setActiveUrl(current)
      setLoading(false)
    })
  }, [])

  useFocusEffect(loadAll)

  async function handleAdd() {
    setError('')
    setSuccessMessage('')

    const label = newLabel.trim()
    const url = newUrl.trim()

    if (!label) {
      setError('Please enter a label (e.g. Home, Office).')
      return
    }
    if (!/^https?:\/\/.+/i.test(url)) {
      setError('URL must start with http:// or https://')
      return
    }

    setSaving(true)
    try {
      await addSavedServer(label, url)
      setNewLabel('')
      setNewUrl('')
      setSuccessMessage(`Saved "${label}" and switched to it.`)
      loadAll()
    } finally {
      setSaving(false)
    }
  }

  async function handleActivate(server) {
    setError('')
    setSuccessMessage('')
    setSwitchingId(server.id)
    try {
      await setApiBaseUrl(server.url)
      setActiveUrl(server.url)
      setSuccessMessage(`Now using "${server.label}".`)
    } finally {
      setSwitchingId(null)
    }
  }

  function handleDelete(server) {
    Alert.alert('Remove server?', `Remove "${server.label}" from your saved servers?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteSavedServer(server.id)
          loadAll()
        },
      },
    ])
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textSecondary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.iconBadge}>
          <MaterialCommunityIcons name="server-network" size={30} color={colors.primary} />
        </View>
        <Text style={styles.title}>Server Address</Text>
        <Text style={styles.subtitle}>
          Save each server you connect to with a label, then switch between them with a tap.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Add New Server</Text>
              <Text style={styles.label}>Label</Text>
              <TextInput
                style={styles.input}
                value={newLabel}
                onChangeText={setNewLabel}
                placeholder="e.g. Home, Office"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.label}>API Base URL</Text>
              <TextInput
                style={styles.input}
                value={newUrl}
                onChangeText={setNewUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder={DEFAULT_API_BASE_URL}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.helperText}>Example: http://192.168.1.15:8000/api</Text>

              {error ? <Text style={styles.error}>{error}</Text> : null}
              {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}

              <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handleAdd} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save & Use</Text>}
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Saved Servers</Text>
            {servers.length === 0 ? (
              <Text style={styles.emptyText}>No servers saved yet — add one above.</Text>
            ) : (
              servers.map((server) => {
                const isActive = server.url === activeUrl
                return (
                  <TouchableOpacity
                    key={server.id}
                    style={[styles.serverCard, isActive && styles.serverCardActive]}
                    onPress={() => handleActivate(server)}
                    disabled={switchingId === server.id}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.serverLabelRow}>
                        {isActive && <MaterialCommunityIcons name="check-circle" size={16} color={colors.primary} />}
                        <Text style={[styles.serverLabel, isActive && styles.serverLabelActive]}>{server.label}</Text>
                      </View>
                      <Text style={styles.serverUrl}>{server.url}</Text>
                    </View>
                    {switchingId === server.id ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                      <TouchableOpacity onPress={() => handleDelete(server)} hitSlop={10} style={styles.deleteButton}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                )
              })
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: 24 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 21, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 24, lineHeight: 18 },
  formSection: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: colors.bg,
    color: colors.text,
  },
  helperText: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  error: { color: colors.danger, fontSize: 13, marginTop: 12 },
  success: { color: colors.success, fontSize: 13, marginTop: 12 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyText: { color: colors.textMuted, fontSize: 13, marginBottom: 20 },
  serverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  serverCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryLight,
  },
  serverLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  serverLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  serverLabelActive: { color: colors.primaryDark },
  serverUrl: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  deleteButton: { padding: 6 },
})
