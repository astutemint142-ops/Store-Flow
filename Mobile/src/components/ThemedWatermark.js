import { View, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from '../theme'

// Faded, oversized grocery/food/cosmetics icons scattered in the
// background of inner pages — same "superstore" theme as the Login
// cluster, but pushed far back so it never competes with real content.
export default function ThemedWatermark() {
  return (
    <View style={styles.container} pointerEvents="none">
      <MaterialCommunityIcons name="cart-variant" size={200} color={colors.primary} style={styles.cart} />
      <MaterialCommunityIcons name="food-apple" size={90} color={colors.accent} style={styles.apple} />
      <MaterialCommunityIcons name="lipstick" size={80} color={colors.blush} style={styles.lipstick} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  cart: { position: 'absolute', top: -30, right: -35, opacity: 0.05 },
  apple: { position: 'absolute', bottom: 40, left: -25, opacity: 0.05 },
  lipstick: { position: 'absolute', bottom: -20, right: 30, opacity: 0.045 },
})
