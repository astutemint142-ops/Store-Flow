import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { apiFetch } from '../api'
import PageHeader from '../components/PageHeader'
import ThemedWatermark from '../components/ThemedWatermark'
import PasswordField from '../components/PasswordField'
import { colors } from '../theme'

function initialsFor(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export default function SettingsScreen({ user, onProfileUpdated }) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  async function handleChangePhoto() {
    setPhotoError('')

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setPhotoError('Photo library permission is required to choose a picture.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })

    if (result.canceled || !result.assets?.[0]) return

    const asset = result.assets[0]
    const filename = asset.uri.split('/').pop() || 'photo.jpg'
    const extMatch = /\.(\w+)$/.exec(filename)
    const type = extMatch ? `image/${extMatch[1].toLowerCase()}` : 'image/jpeg'

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('photo', { uri: asset.uri, name: filename, type })

      const updated = await apiFetch('/profile/photo', { method: 'POST', body: formData })
      onProfileUpdated(updated)
    } catch (err) {
      setPhotoError(err.data?.errors?.photo?.[0] || err.data?.message || 'Failed to upload photo.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleProfileSubmit() {
    setProfileError('')
    setProfileSuccess('')
    setSavingProfile(true)
    try {
      const updated = await apiFetch('/profile', { method: 'PUT', body: JSON.stringify({ name, email }) })
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

  async function handlePasswordSubmit() {
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
    <View style={styles.container}>
    <ThemedWatermark />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <PageHeader icon="cog-outline" title="Settings" subtitle="Manage your profile and account security." />

      <View style={[styles.section, styles.photoSection]}>
        {user.profile_photo_url ? (
          <Image source={{ uri: user.profile_photo_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>{initialsFor(user.name)}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.photoButton} onPress={handleChangePhoto} disabled={uploadingPhoto}>
            {uploadingPhoto ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={styles.photoButtonText}>Change Photo</Text>
            )}
          </TouchableOpacity>
          {photoError ? <Text style={styles.error}>{photoError}</Text> : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        {profileError ? <Text style={styles.error}>{profileError}</Text> : null}
        {profileSuccess ? <Text style={styles.success}>{profileSuccess}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleProfileSubmit} disabled={savingProfile}>
          {savingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Profile</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <Text style={styles.label}>Current Password</Text>
        <PasswordField value={currentPassword} onChangeText={setCurrentPassword} />
        <Text style={styles.label}>New Password</Text>
        <PasswordField value={newPassword} onChangeText={setNewPassword} />
        <Text style={styles.label}>Confirm New Password</Text>
        <PasswordField value={confirmPassword} onChangeText={setConfirmPassword} />
        {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
        {passwordSuccess ? <Text style={styles.success}>{passwordSuccess}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handlePasswordSubmit} disabled={savingPassword}>
          {savingPassword ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Change Password</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  photoSection: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: { color: colors.primary, fontWeight: '800', fontSize: 20 },
  photoButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
  },
  photoButtonText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.bg,
    color: colors.text,
  },
  error: { color: colors.danger, marginTop: 10, fontSize: 13 },
  success: { color: colors.success, marginTop: 10, fontSize: 13 },
  button: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  buttonText: { color: '#fff', fontWeight: '700' },
})
