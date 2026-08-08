import { useRef, useState } from 'react'
import { Settings as SettingsIcon, User, KeyRound, Camera } from 'lucide-react'
import { apiFetch } from '../api'
import PasswordInput from '../components/PasswordInput'

function initialsFor(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export default function SettingsPage({ user, onProfileUpdated }) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [photoError, setPhotoError] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  async function handlePhotoSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoError('')
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const updated = await apiFetch('/profile/photo', { method: 'POST', body: formData })
      onProfileUpdated(updated)
    } catch (err) {
      setPhotoError(err.data?.errors?.photo?.[0] || err.data?.message || 'Failed to upload photo.')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  async function handleProfileSubmit(e) {
    e.preventDefault()
    setProfileError('')
    setProfileSuccess('')
    setSavingProfile(true)

    try {
      const updated = await apiFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email }),
      })
      onProfileUpdated(updated)
      setProfileSuccess('Profile updated successfully.')
    } catch (err) {
      const message =
        err.data?.errors?.email?.[0] || err.data?.errors?.name?.[0] || err.data?.message || 'Failed to update profile.'
      setProfileError(message)
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    setSavingPassword(true)
    try {
      await apiFetch('/profile/password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess('Password changed successfully.')
    } catch (err) {
      const message =
        err.data?.errors?.current_password?.[0] || err.data?.errors?.password?.[0] || err.data?.message || 'Failed to change password.'
      setPasswordError(message)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <SettingsIcon size={22} color="var(--color-primary)" />
        <h1 style={{ fontSize: 22 }}>Settings</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 24 }}>
        Manage your profile and account security.
      </p>

      <section className="card" style={{ padding: 22, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ position: 'relative' }}>
          {user.profile_photo_url ? (
            <img
              src={user.profile_photo_url}
              alt={user.name}
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              {initialsFor(user.name)}
            </div>
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelected}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="btn-ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Camera size={15} /> {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
          </button>
          {photoError && <p style={{ color: 'var(--color-danger)', fontSize: 13, marginTop: 8 }}>{photoError}</p>}
        </div>
      </section>

      <section className="card" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <User size={17} color="var(--color-primary)" />
          <h2 style={{ fontSize: 16 }}>Profile</h2>
        </div>
        <form onSubmit={handleProfileSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>
          {profileError && <p style={{ color: 'var(--color-danger)', fontSize: 14 }}>{profileError}</p>}
          {profileSuccess && <p style={{ color: 'var(--color-success)', fontSize: 14 }}>{profileSuccess}</p>}
          <button type="submit" className="btn-primary" disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </section>

      <section className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <KeyRound size={17} color="var(--color-primary)" />
          <h2 style={{ fontSize: 16 }}>Change Password</h2>
        </div>
        <form onSubmit={handlePasswordSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Current Password</label>
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>New Password</label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Confirm New Password</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {passwordError && <p style={{ color: 'var(--color-danger)', fontSize: 14 }}>{passwordError}</p>}
          {passwordSuccess && <p style={{ color: 'var(--color-success)', fontSize: 14 }}>{passwordSuccess}</p>}
          <button type="submit" className="btn-primary" disabled={savingPassword}>
            {savingPassword ? 'Saving...' : 'Change Password'}
          </button>
        </form>
      </section>
    </div>
  )
}
