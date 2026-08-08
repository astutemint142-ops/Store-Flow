import { useState } from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { colors } from '../theme'

// Mirrors the web app's PasswordInput — same show/hide eye/monkey toggle.
export default function PasswordField({ style, inputStyle, ...inputProps }) {
  const [visible, setVisible] = useState(false)

  return (
    <View style={[styles.wrapper, style]}>
      <TextInput style={[styles.input, inputStyle]} secureTextEntry={!visible} {...inputProps} />
      <TouchableOpacity
        onPress={() => setVisible((v) => !v)}
        style={styles.toggle}
        hitSlop={10}
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      >
        <Text style={styles.toggleText}>{visible ? '🙈' : '👁️'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingRight: 40,
    fontSize: 15,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  toggle: {
    position: 'absolute',
    right: 10,
    padding: 4,
  },
  toggleText: { fontSize: 16 },
})
