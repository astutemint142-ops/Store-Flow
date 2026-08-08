import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import OwnerDashboardScreen from '../screens/OwnerDashboardScreen'
import CategoriesScreen from '../screens/CategoriesScreen'
import ItemsScreen from '../screens/ItemsScreen'
import OrderEntryScreen from '../screens/OrderEntryScreen'
import PaymentsScreen from '../screens/PaymentsScreen'
import LowStockScreen from '../screens/LowStockScreen'
import OrdersHistoryScreen from '../screens/OrdersHistoryScreen'
import DueReminderHistoryScreen from '../screens/DueReminderHistoryScreen'
import OrderEditScreen from '../screens/OrderEditScreen'
import StaffScreen from '../screens/StaffScreen'
import StaffActivityScreen from '../screens/StaffActivityScreen'
import PurchaseEntryScreen from '../screens/PurchaseEntryScreen'
import ReportsScreen from '../screens/ReportsScreen'
import SettingsScreen from '../screens/SettingsScreen'
import DrawerHeader from './DrawerHeader'
import { colors } from '../theme'

const Drawer = createDrawerNavigator()

// Keeps a screen reachable via navigation.navigate() (e.g. from a dashboard
// "View all" tap) without showing it as a row in the drawer menu.
const HIDDEN = { drawerItemStyle: { height: 0, margin: 0 } }

function drawerIcon(name) {
  return ({ color, size }) => <MaterialCommunityIcons name={name} size={size} color={color} />
}

export default function OwnerDrawer({ user, onProfileUpdated, onLogout }) {
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
      <Drawer.Screen name="Dashboard" component={OwnerDashboardScreen} options={{ drawerIcon: drawerIcon('view-dashboard-outline') }} />
      <Drawer.Screen name="Categories" component={CategoriesScreen} options={{ drawerIcon: drawerIcon('tag-multiple-outline') }} />
      <Drawer.Screen name="Items" component={ItemsScreen} options={{ drawerIcon: drawerIcon('basket-outline') }} />
      <Drawer.Screen
        name="NewOrder"
        component={OrderEntryScreen}
        options={{ title: 'New Order', drawerIcon: drawerIcon('cart-plus') }}
      />
      <Drawer.Screen name="Payments" component={PaymentsScreen} options={{ drawerIcon: drawerIcon('cash-multiple') }} />
      <Drawer.Screen
        name="LowStock"
        component={LowStockScreen}
        options={{ title: 'Low Stock', drawerIcon: drawerIcon('alert-outline') }}
      />
      <Drawer.Screen
        name="OrdersHistory"
        component={OrdersHistoryScreen}
        initialParams={{ mode: 'all' }}
        options={{ title: 'Order History', ...HIDDEN }}
      />
      <Drawer.Screen
        name="DueReminderHistory"
        component={DueReminderHistoryScreen}
        options={{ title: 'Due Reminders', ...HIDDEN }}
      />
      <Drawer.Screen name="OrderEdit" component={OrderEditScreen} options={{ title: 'Edit Order', ...HIDDEN }} />
      <Drawer.Screen name="Staff" component={StaffScreen} options={{ drawerIcon: drawerIcon('account-group-outline') }} />
      <Drawer.Screen
        name="StaffActivity"
        component={StaffActivityScreen}
        options={{ title: 'Staff Activity', drawerIcon: drawerIcon('chart-timeline-variant') }}
      />
      <Drawer.Screen
        name="Purchases"
        component={PurchaseEntryScreen}
        options={{ title: 'Record Purchase', drawerIcon: drawerIcon('truck-delivery-outline') }}
      />
      <Drawer.Screen name="Reports" component={ReportsScreen} options={{ drawerIcon: drawerIcon('chart-bar') }} />
      <Drawer.Screen name="Settings" options={{ drawerIcon: drawerIcon('cog-outline') }}>
        {() => <SettingsScreen user={user} onProfileUpdated={onProfileUpdated} />}
      </Drawer.Screen>
    </Drawer.Navigator>
  )
}
