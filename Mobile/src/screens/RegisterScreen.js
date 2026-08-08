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
import { apiFetch, setToken, setTenantId } from '../api'
import AuthHeroBanner from '../components/AuthHeroBanner'
import PasswordField from '../components/PasswordField'
import { colors } from '../theme'

const emptyForm = {
  business_name: '',
  owner_name: '',
  owner_email: '',
  owner_phone: '',
  password: '',
  password_confirmation: '',
}

export default function RegisterScreen({ onRegistered, navigation }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [step, setStep] = useState('form') // 'form' | 'code'
  const [registrationToken, setRegistrationToken] = useState('')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setError('')

    if (form.password !== form.password_confirmation) {
      setError('Password and confirmation do not match.')
      return
    }

    setLoading(true)
    try {
      const data = await apiFetch('/register/start', {
        method: 'POST',
        body: JSON.stringify(form),
      })

      setRegistrationToken(data.registration_token)
      setStep('code')
    } catch (err) {
      const message =
        err.data?.errors?.owner_email?.[0] ||
        err.data?.errors?.password?.[0] ||
        err.data?.message ||
        'Failed to register. Please check your details.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    setError('')
    setVerifying(true)
    try {
      const data = await apiFetch('/register/verify', {
        method: 'POST',
        body: JSON.stringify({ registration_token: registrationToken, code }),
      })

      await setToken(data.token)
      await setTenantId(data.user.tenant_id)
      onRegistered(data.user)
    } catch (err) {
      const message = err.data?.errors?.code?.[0] || err.data?.message || 'Failed to verify code.'
      setError(message)
    } finally {
      setVerifying(false)
    }
  }

  async function handleResend() {
    setError('')
    setResendMessage('')
    setResending(true)
    try {
      await apiFetch('/register/resend', {
        method: 'POST',
        body: JSON.stringify({ registration_token: registrationToken }),
      })
      setResendMessage('A new code has been sent to your email.')
    } catch (err) {
      setError(err.data?.message || 'Failed to resend code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <View style={styles.screen}>
      <AuthHeroBanner
        icon={step === 'form' ? 'store-outline' : 'email-check-outline'}
        showCategoryIcons={step === 'form'}
        subtitle="Almost there"
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {step === 'form' ? (
            <>
              <Text style={styles.formTitle}>Create your account</Text>
              <Text style={styles.formSubtitle}>Set up your Owner account to get started</Text>

              <Field label="Business Name" value={form.business_name} onChangeText={(v) => updateField('business_name', v)} />
              <Field label="Your Name" value={form.owner_name} onChangeText={(v) => updateField('owner_name', v)} />
              <Field
                label="Email"
                value={form.owner_email}
                onChangeText={(v) => updateField('owner_email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field
                label="Phone (optional)"
                value={form.owner_phone}
                onChangeText={(v) => updateField('owner_phone', v)}
                keyboardType="phone-pad"
              />
              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <PasswordField value={form.password} onChangeText={(v) => updateField('password', v)} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Confirm Password</Text>
                <PasswordField
                  value={form.password_confirmation}
                  onChangeText={(v) => updateField('password_confirmation', v)}
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
                <Text style={styles.linkText}>
                  Already have an account? <Text style={styles.linkBold}>Log in</Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.formTitle}>Check your email</Text>
              <Text style={styles.formSubtitle}>
                We sent a 6-digit code to{'\n'}
                <Text style={{ fontWeight: '700', color: colors.text }}>{form.owner_email}</Text>
              </Text>

              <Field
                label="Verification Code"
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
                style={{ textAlign: 'center', fontSize: 22, letterSpacing: 8 }}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}
              {resendMessage ? <Text style={styles.success}>{resendMessage}</Text> : null}

              <TouchableOpacity
                style={[styles.button, verifying && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={verifying}
              >
                {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Create Account</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleResend} disabled={resending} style={styles.linkRow}>
                <Text style={styles.linkText}>
                  Didn't get the email? <Text style={styles.linkBold}>{resending ? 'Sending...' : 'Resend code'}</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep('form')} style={styles.linkRow}>
                <Text style={styles.linkText}>← Back to edit details</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

function Field({ label, style, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={[styles.input, style]} {...inputProps} />
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
  formTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 8 },
  formSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 22, marginTop: 4 },
  field: { marginBottom: 14 },
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
})
