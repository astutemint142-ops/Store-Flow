import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import SuperAdminScreen from '../screens/SuperAdminScreen'
import SettingsScreen from '../screens/SettingsScreen'
import DrawerHeader from './DrawerHeader'
import { colors } from '../theme'

const Drawer = createDrawerNavigator()

function drawerIcon(name) {
  return ({ color, size }) => <MaterialCommunityIcons name={name} size={size} color={color} />
}

export default function SuperAdminDrawer({ user, onProfileUpdated, onLogout }) {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        drawerActiveTintColor: colors.primary,
        drawerActiveBackgroundColor: colors.primaryLight,
        drawerInactiveTintColor: colors.textSecondary,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
      drawerContent={(props) => (
        <DrawerContentScrollView {...props}>
          <DrawerHeader user={user} onLogout={onLogout} />
          <DrawerItemList {...props} />
        </DrawerContentScrollView>
      )}
    >
      <Drawer.Screen name="Businesses" component={SuperAdminScreen} options={{ drawerIcon: drawerIcon('domain') }} />
      <Drawer.Screen name="Settings" options={{ drawerIcon: drawerIcon('cog-outline') }}>
        {() => <SettingsScreen user={user} onProfileUpdated={onProfileUpdated} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  )
}
