import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../theme'

const CATEGORY_ICONS = [
  { name: 'basket-outline', bg: 'rgba(255,255,255,0.22)' },
  { name: 'food-apple', bg: 'rgba(255,255,255,0.22)' },
  { name: 'lipstick', bg: 'rgba(255,255,255,0.22)' },
  { name: 'coffee', bg: 'rgba(255,255,255,0.22)' },
]

// Clean, professional auth-screen banner — a colored rounded-bottom
// header with a badge icon, used on Login/Register (and their
// forgot-password steps) instead of a scattered icon cluster.
export default function AuthHeroBanner({
  icon = 'cart-variant',
  title = 'StoreFlow',
  subtitle,
  showCategoryIcons = true,
}) {
  return (
    <View style={styles.banner}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.iconRing}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons name={icon} size={36} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.title}>{title}</Text>

        {showCategoryIcons ? (
          <View style={styles.categoryRow}>
            {CATEGORY_ICONS.map((item) => (
              <View key={item.name} style={[styles.categoryBadge, { backgroundColor: item.bg }]}>
                <MaterialCommunityIcons name={item.name} size={17} color="#fff" />
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  safeArea: {
    alignItems: 'center',
    paddingBottom: 22,
  },
  iconRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 14,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 23, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: '600' },
  categoryRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  categoryBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
