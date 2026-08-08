import { useState } from 'react'
import { ShoppingCart, Apple, Carrot, Sparkles, Milk, Cookie, Store, KeyRound } from 'lucide-react'
import { apiFetch, setTenantId, setToken } from '../api'
import PasswordInput from './PasswordInput'
import './Login.css'

export default function Login({ onLoggedIn, onShowRegister }) {
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

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      setToken(data.token)
      setTenantId(data.user.tenant_id)
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

  async function handleForgotEmailSubmit(e) {
    e.preventDefault()
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

  async function handleResetSubmit(e) {
    e.preventDefault()
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
    <div className="login-page">
      <div className="login-hero">
        <span className="hero-icon hero-icon-1"><ShoppingCart size={34} /></span>
        <span className="hero-icon hero-icon-2"><Apple size={26} /></span>
        <span className="hero-icon hero-icon-3"><Sparkles size={28} /></span>
        <span className="hero-icon hero-icon-4"><Milk size={22} /></span>
        <span className="hero-icon hero-icon-5"><Carrot size={20} /></span>
        <span className="hero-icon hero-icon-6"><Cookie size={18} /></span>

        <div className="login-hero-content">
          <div className="login-logo">
            <span className="login-logo-badge">
              <Store size={18} />
            </span>
            StoreFlow
          </div>
          <h1>Your neighborhood superstore, organized.</h1>
          <p>Grocery, cosmetics and everyday essentials — orders, stock and payments, all in one place.</p>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-card card">
          {mode === 'login' && (
            <>
              <h2>Welcome back</h2>
              <p className="login-subtitle">Sign in to continue to StoreFlow</p>

              <form onSubmit={handleSubmit}>
                <div className="login-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="login-field">
                  <label>Password</label>
                  <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>

                <div style={{ textAlign: 'right', marginBottom: 12 }}>
                  <button
                    type="button"
                    onClick={startForgotPassword}
                    className="btn-ghost"
                    style={{ padding: '2px 4px', fontSize: 13, color: 'var(--color-text-secondary)' }}
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <p style={{ color: 'var(--color-danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>
                )}
                {infoMessage && (
                  <p style={{ color: 'var(--color-success)', fontSize: 14, marginBottom: 12 }}>{infoMessage}</p>
                )}
                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 14, marginTop: 20, color: 'var(--color-text-secondary)' }}>
                New business?{' '}
                <button
                  type="button"
                  onClick={onShowRegister}
                  className="btn-ghost"
                  style={{ padding: '2px 6px', fontWeight: 700, color: 'var(--color-primary)' }}
                >
                  Register here
                </button>
              </p>
            </>
          )}

          {mode === 'forgot-email' && (
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
                  <KeyRound size={22} />
                </span>
              </div>
              <h2 style={{ textAlign: 'center' }}>Reset your password</h2>
              <p className="login-subtitle" style={{ textAlign: 'center' }}>
                Enter your account email and we'll send you a reset code.
              </p>

              <form onSubmit={handleForgotEmailSubmit}>
                <div className="login-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                {error && (
                  <p style={{ color: 'var(--color-danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>
                )}

                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 13, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError('') }}
                  className="btn-ghost"
                  style={{ padding: '2px 6px', color: 'var(--color-text-secondary)' }}
                >
                  ← Back to login
                </button>
              </p>
            </>
          )}

          {mode === 'forgot-reset' && (
            <>
              <h2 style={{ textAlign: 'center' }}>Enter your reset code</h2>
              <p className="login-subtitle" style={{ textAlign: 'center' }}>
                If an account exists for <strong>{resetEmail}</strong>, a 6-digit code was sent to it.
              </p>

              <form onSubmit={handleResetSubmit}>
                <div className="login-field">
                  <label>Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    required
                    style={{ width: '100%', letterSpacing: 6, fontSize: 20, textAlign: 'center' }}
                  />
                </div>
                <div className="login-field">
                  <label>New Password</label>
                  <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <div className="login-field">
                  <label>Confirm New Password</label>
                  <PasswordInput
                    value={newPasswordConfirmation}
                    onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p style={{ color: 'var(--color-danger)', fontSize: 14, marginBottom: 12 }}>{error}</p>
                )}

                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 13, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => { setMode('forgot-email'); setError('') }}
                  className="btn-ghost"
                  style={{ padding: '2px 6px', color: 'var(--color-text-secondary)' }}
                >
                  ← Use a different email
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
