import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import OrderEntryScreen from '../screens/OrderEntryScreen'
import PaymentsScreen from '../screens/PaymentsScreen'
import MyOrdersScreen from '../screens/MyOrdersScreen'
import OrderEditScreen from '../screens/OrderEditScreen'
import SettingsScreen from '../screens/SettingsScreen'
import DrawerHeader from './DrawerHeader'
import { colors } from '../theme'

const Drawer = createDrawerNavigator()
const HIDDEN = { drawerItemStyle: { height: 0, margin: 0 } }

function drawerIcon(name) {
  return ({ color, size }) => <MaterialCommunityIcons name={name} size={size} color={color} />
}

export default function CounterStaffDrawer({ user, onProfileUpdated, onLogout }) {
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
        name="NewOrder"
        component={OrderEntryScreen}
        options={{ title: 'New Order', drawerIcon: drawerIcon('cart-plus') }}
      />
      <Drawer.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{ title: 'My Orders', drawerIcon: drawerIcon('clipboard-check-outline') }}
      />
      <Drawer.Screen name="OrderEdit" component={OrderEditScreen} options={{ title: 'Edit Order', ...HIDDEN }} />
      <Drawer.Screen name="Payments" component={PaymentsScreen} options={{ drawerIcon: drawerIcon('cash-multiple') }} />
      <Drawer.Screen name="Settings" options={{ drawerIcon: drawerIcon('cog-outline') }}>
        {() => <SettingsScreen user={user} onProfileUpdated={onProfileUpdated} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  )
}
