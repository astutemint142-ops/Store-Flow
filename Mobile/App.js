import 'react-native-gesture-handler'
import { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { apiFetch, clearToken, getToken, setTenantId } from './src/api'
import LoginScreen from './src/screens/LoginScreen'
import RegisterScreen from './src/screens/RegisterScreen'
import ApiSettingsScreen from './src/screens/ApiSettingsScreen'
import OwnerDrawer from './src/navigation/OwnerDrawer'
import CounterStaffDrawer from './src/navigation/CounterStaffDrawer'
import StoreWorkerDrawer from './src/navigation/StoreWorkerDrawer'
import SuperAdminDrawer from './src/navigation/SuperAdminDrawer'
import { colors } from './src/theme'

const Stack = createNativeStackNavigator()

export default function App() {
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      const token = await getToken()
      if (!token) {
        setCheckingSession(false)
        return
      }

      try {
        const data = await apiFetch('/user')
        await setTenantId(data.tenant_id)
        setUser(data)
      } catch {
        await clearToken()
      } finally {
        setCheckingSession(false)
      }
    }

    restoreSession()
  }, [])

  async function handleLogout() {
    try {
      await apiFetch('/logout', { method: 'POST' })
    } catch {
      // ignore — clear the local token regardless
    }
    await clearToken()
    await setTenantId(null)
    setUser(null)
  }

  if (checkingSession) {
    return (
      <SafeAreaProvider>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaProvider>
    )
  }

  function renderHome() {
    const props = { user, onProfileUpdated: setUser, onLogout: handleLogout }
    switch (user.role) {
      case 'owner':
        return <OwnerDrawer {...props} />
      case 'counter_staff':
        return <CounterStaffDrawer {...props} />
      case 'store_worker':
        return <StoreWorkerDrawer {...props} />
      case 'super_admin':
        return <SuperAdminDrawer {...props} />
      default:
        return null
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <NavigationContainer>
          {user ? (
            renderHome()
          ) : (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login">
                {(props) => <LoginScreen {...props} onLoggedIn={setUser} />}
              </Stack.Screen>
              <Stack.Screen name="Register">
                {(props) => <RegisterScreen {...props} onRegistered={setUser} />}
              </Stack.Screen>
              <Stack.Screen name="ApiSettings" component={ApiSettingsScreen} />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
})
