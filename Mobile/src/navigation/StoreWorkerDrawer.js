import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import WorkerPickListScreen from '../screens/WorkerPickListScreen'
import MyPickedOrdersScreen from '../screens/MyPickedOrdersScreen'
import SettingsScreen from '../screens/SettingsScreen'
import DrawerHeader from './DrawerHeader'
import { colors } from '../theme'

const Drawer = createDrawerNavigator()

function drawerIcon(name) {
  return ({ color, size }) => <MaterialCommunityIcons name={name} size={size} color={color} />
}

export default function StoreWorkerDrawer({ user, onProfileUpdated, onLogout }) {
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
      <Drawer.Screen
        name="PickList"
        component={WorkerPickListScreen}
        options={{ title: 'Pick List', drawerIcon: drawerIcon('clipboard-list-outline') }}
      />
      <Drawer.Screen
        name="MyOrders"
        component={MyPickedOrdersScreen}
        options={{ title: 'My Orders', drawerIcon: drawerIcon('clipboard-check-outline') }}
      />
      <Drawer.Screen name="Settings" options={{ drawerIcon: drawerIcon('cog-outline') }}>
        {() => <SettingsScreen user={user} onProfileUpdated={onProfileUpdated} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  )
}
