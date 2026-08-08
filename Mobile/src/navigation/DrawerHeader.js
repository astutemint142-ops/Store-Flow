import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme'

function initialsFor(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export default function DrawerHeader({ user, onLogout }) {
  function confirmLogout() {
    Alert.alert('Log out?', 'You will need to log in again to continue.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: onLogout },
    ])
  }

  return (
    <SafeAreaView edges={['top']} style={styles.header}>
      <View style={styles.identityRow}>
        {user.profile_photo_url ? (
          <Image source={{ uri: user.profile_photo_url }} style={styles.avatar} />
        ) : (
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>{initialsFor(user.name)}</Text>
          </View>
        )}
        <View>
          <Text style={styles.headerTitle}>StoreFlow</Text>
          <Text style={styles.headerSubtitle}>{user.name}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={confirmLogout} style={styles.logoutButton} hitSlop={10}>
        <Ionicons name="log-out-outline" size={22} color={colors.danger} />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  headerSubtitle: { fontSize: 12, color: colors.textSecondary },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerLight,
  },
})
