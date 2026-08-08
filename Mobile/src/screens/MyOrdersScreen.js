import OrdersHistoryScreen from './OrdersHistoryScreen'

// Thin wrapper so Counter Staff gets a dedicated "My Orders" drawer entry
// that always shows only their own bookings, reusing OrdersHistoryScreen's
// filtering/list UI (used as "Order History" for the Owner in mode "all").
export default function MyOrdersScreen(props) {
  return <OrdersHistoryScreen {...props} route={{ ...props.route, params: { mode: 'mine' } }} />
}
