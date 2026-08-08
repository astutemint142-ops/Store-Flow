import { useState } from 'react'
import { Store, ShoppingBag, Sparkles, Carrot, MailCheck } from 'lucide-react'
import { apiFetch, setTenantId, setToken } from '../api'
import PasswordInput from './PasswordInput'
import './Login.css'

const emptyForm = {
  business_name: '',
  owner_name: '',
  owner_email: '',
  owner_phone: '',
  password: '',
  password_confirmation: '',
}

export default function RegisterPage({ onRegistered, onShowLogin }) {
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

  async function handleSubmit(e) {
    e.preventDefault()
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

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    setVerifying(true)
    try {
      const data = await apiFetch('/register/verify', {
        method: 'POST',
        body: JSON.stringify({ registration_token: registrationToken, code }),
      })

      setToken(data.token)
      setTenantId(data.user.tenant_id)
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
    <div className="login-page">
      <div className="login-hero">
        <span className="hero-icon hero-icon-1"><Store size={34} /></span>
        <span className="hero-icon hero-icon-2"><ShoppingBag size={26} /></span>
        <span className="hero-icon hero-icon-3"><Sparkles size={28} /></span>
        <span className="hero-icon hero-icon-4"><Carrot size={22} /></span>

        <div className="login-hero-content">
          <div className="login-logo">
            <span className="login-logo-badge">
              <Store size={18} />
            </span>
            StoreFlow
          </div>
          <h1>Bring your store online in minutes.</h1>
          <p>Register your business and get your own private StoreFlow workspace — your data, completely separate from every other store.</p>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-card card">
          {step === 'form' ? (
            <>
              <h2>Register your business</h2>
              <p className="login-subtitle">Create your Owner account to get started</p>

              <form onSubmit={handleSubmit}>
                <div className="login-field">
                  <label>Business Name</label>
                  <input
                    type="text"
                    value={form.business_name}
                    onChange={(e) => updateField('business_name', e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="login-field">
                  <label>Your Name</label>
                  <input
                    type="text"
                    value={form.owner_name}
                    onChange={(e) => updateField('owner_name', e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="login-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.owner_email}
                    onChange={(e) => updateField('owner_email', e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="login-field">
                  <label>Phone (optional)</label>
                  <input
                    type="tel"
                    value={form.owner_phone}
                    onChange={(e) => updateField('owner_phone', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="login-field">
                  <label>Password</label>
                  <PasswordInput
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    required
                  />
                </div>
                <div className="login-field">
                  <label>Confirm Password</label>
                  <PasswordInput
                    value={form.password_confirmation}
                    onChange={(e) => updateField('password_confirmation', e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p style={{ color: 'var(--color-danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>
                )}

                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Sending verification code...' : 'Continue'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 14, marginTop: 20, color: 'var(--color-text-secondary)' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onShowLogin}
                  className="btn-ghost"
                  style={{ padding: '2px 6px', fontWeight: 700, color: 'var(--color-primary)' }}
                >
                  Log in
                </button>
              </p>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <span
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'var(--color-primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                  }}
                >
                  <MailCheck size={24} />
                </span>
              </div>
              <h2 style={{ textAlign: 'center' }}>Check your email</h2>
              <p className="login-subtitle" style={{ textAlign: 'center' }}>
                We sent a 6-digit code to <strong>{form.owner_email}</strong>
              </p>

              <form onSubmit={handleVerify}>
                <div className="login-field">
                  <label>Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                    style={{ width: '100%', letterSpacing: 6, fontSize: 20, textAlign: 'center' }}
                  />
                </div>

                {error && (
                  <p style={{ color: 'var(--color-danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>
                )}
                {resendMessage && (
                  <p style={{ color: 'var(--color-success)', fontSize: 14, marginBottom: 12 }}>{resendMessage}</p>
                )}

                <button type="submit" className="btn-primary" disabled={verifying} style={{ width: '100%' }}>
                  {verifying ? 'Verifying...' : 'Verify & Create Account'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 14, marginTop: 20, color: 'var(--color-text-secondary)' }}>
                Didn't get the email?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="btn-ghost"
                  style={{ padding: '2px 6px', fontWeight: 700, color: 'var(--color-primary)' }}
                >
                  {resending ? 'Sending...' : 'Resend code'}
                </button>
              </p>
              <p style={{ textAlign: 'center', fontSize: 13, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="btn-ghost"
                  style={{ padding: '2px 6px', color: 'var(--color-text-secondary)' }}
                >
                  ← Back to edit details
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
