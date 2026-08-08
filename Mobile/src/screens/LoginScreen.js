import { useState } from 'react'
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
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { apiFetch, setToken, setTenantId } from '../api'
import AuthHeroBanner from '../components/AuthHeroBanner'
import PasswordField from '../components/PasswordField'
import { colors } from '../theme'

export default function LoginScreen({ onLoggedIn, navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [mode, setMode] = useState('login') // 'login' | 'forgot-email' | 'forgot-reset'
  const [resetEmail, setResetEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  async function handleLogin() {
    setError('')
    setLoading(true)
    try {
      const data = await apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      await setToken(data.token)
      await setTenantId(data.user.tenant_id)
      onLoggedIn(data.user)
    } catch (err) {
      if (err.status === 422) {
        setError('Invalid email or password.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  function startForgotPassword() {
    setError('')
    setInfoMessage('')
    setResetEmail(email)
    setMode('forgot-email')
  }

  async function handleForgotEmailSubmit() {
    setError('')
    setLoading(true)
    try {
      const data = await apiFetch('/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail }),
      })
      setInfoMessage(data.message)
      setMode('forgot-reset')
    } catch (err) {
      setError(err.data?.message || 'Failed to send reset code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetSubmit() {
    setError('')

    if (newPassword !== newPasswordConfirmation) {
      setError('New password and confirmation do not match.')
      return
    }

    setLoading(true)
    try {
      await apiFetch('/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode,
          password: newPassword,
          password_confirmation: newPasswordConfirmation,
        }),
      })
      setMode('login')
      setEmail(resetEmail)
      setPassword('')
      setResetCode('')
      setNewPassword('')
      setNewPasswordConfirmation('')
      setInfoMessage('Password reset successfully. Please log in with your new password.')
    } catch (err) {
      const message = err.data?.errors?.code?.[0] || err.data?.message || 'Failed to reset password.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.screen}>
      <AuthHeroBanner
        icon={mode === 'login' ? 'cart-variant' : 'key-variant'}
        showCategoryIcons={mode === 'login'}
        subtitle="Account recovery"
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {mode === 'login' && (
            <>
              <Text style={styles.formTitle}>Welcome back</Text>
              <Text style={styles.formSubtitle}>Sign in to continue to StoreFlow</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@example.com"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <PasswordField value={password} onChangeText={setPassword} placeholder="••••••••" />
              </View>

              <TouchableOpacity onPress={startForgotPassword} style={styles.forgotLink}>
                <Text style={styles.forgotLinkText}>Forgot password?</Text>
              </TouchableOpacity>

              {error ? <Text style={styles.error}>{error}</Text> : null}
              {infoMessage ? <Text style={styles.success}>{infoMessage}</Text> : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
                <Text style={styles.linkText}>
                  New business? <Text style={styles.linkBold}>Register here</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('ApiSettings')} style={styles.settingsLink}>
                <MaterialCommunityIcons name="cog-outline" size={14} color={colors.textMuted} />
                <Text style={styles.settingsLinkText}>Settings</Text>
              </TouchableOpacity>
            </>
          )}

          {mode === 'forgot-email' && (
            <>
              <Text style={styles.formTitle}>Reset your password</Text>
              <Text style={styles.formSubtitle}>Enter your account email and we'll send you a reset code.</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@example.com"
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleForgotEmailSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Reset Code</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setMode('login'); setError('') }} style={styles.linkRow}>
                <Text style={styles.linkText}>← Back to login</Text>
              </TouchableOpacity>
            </>
          )}

          {mode === 'forgot-reset' && (
            <>
              <Text style={styles.formTitle}>Enter your reset code</Text>
              <Text style={styles.formSubtitle}>
                If an account exists for{'\n'}
                <Text style={{ fontWeight: '700', color: colors.text }}>{resetEmail}</Text>, a 6-digit code was sent to it.
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={[styles.input, { textAlign: 'center', fontSize: 22, letterSpacing: 8 }]}
                  value={resetCode}
                  onChangeText={(v) => setResetCode(v.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>New Password</Text>
                <PasswordField value={newPassword} onChangeText={setNewPassword} />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirm New Password</Text>
                <PasswordField value={newPasswordConfirmation} onChangeText={setNewPasswordConfirmation} />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setMode('forgot-email'); setError('') }} style={styles.linkRow}>
                <Text style={styles.linkText}>← Use a different email</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 24,
  },
  formTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  forgotLink: { alignItems: 'flex-end', marginBottom: 12, marginTop: -8 },
  forgotLinkText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  success: { color: colors.success, fontSize: 13, marginBottom: 12 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  linkRow: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 14, color: colors.textSecondary },
  linkBold: { color: colors.primary, fontWeight: '700' },
  settingsLink: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center', marginTop: 24, padding: 6 },
  settingsLinkText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
})
