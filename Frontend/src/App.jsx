import { useEffect, useState } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { apiFetch, clearToken, getToken, setTenantId } from './api'
import Login from './components/Login'
import RegisterPage from './components/RegisterPage'
import StaffLayout from './pages/StaffLayout'
import OwnerHome from './pages/OwnerHome'
import CategoriesPage from './pages/CategoriesPage'
import ItemsPage from './pages/ItemsPage'
import OrderEntryPage from './pages/OrderEntryPage'
import WorkerPickList from './pages/WorkerPickList'
import PaymentsPage from './pages/PaymentsPage'
import LowStockPage from './pages/LowStockPage'
import PurchaseEntryPage from './pages/PurchaseEntryPage'
import SettingsPage from './pages/SettingsPage'
import ReportsPage from './pages/ReportsPage'
import StaffManagementPage from './pages/StaffManagementPage'
import StaffActivityPage from './pages/StaffActivityPage'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import OrdersHistoryPage from './pages/OrdersHistoryPage'
import DueReminderHistoryPage from './pages/DueReminderHistoryPage'
import MyPickedOrdersPage from './pages/MyPickedOrdersPage'
import OrderEditPage from './pages/OrderEditPage'

const OWNER_NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/categories', label: 'Categories' },
  { to: '/items', label: 'Items' },
  { to: '/orders/new', label: 'New Order' },
  { to: '/orders/history', label: 'Order History' },
  { to: '/payments', label: 'Payments' },
  { to: '/low-stock', label: 'Low Stock' },
  { to: '/purchases', label: 'Purchases' },
  { to: '/reports', label: 'Reports' },
  { to: '/staff', label: 'Staff' },
  { to: '/staff-activity', label: 'Staff Activity' },
  { to: '/settings', label: 'Settings' },
]

const COUNTER_STAFF_NAV_LINKS = [
  { to: '/', label: 'New Order', end: true },
  { to: '/orders/mine', label: 'My Orders' },
  { to: '/payments', label: 'Payments' },
  { to: '/settings', label: 'Settings' },
]

const STORE_WORKER_NAV_LINKS = [
  { to: '/', label: 'Pick List', end: true },
  { to: '/my-orders', label: 'My Orders' },
  { to: '/settings', label: 'Settings' },
]

const SUPER_ADMIN_NAV_LINKS = [{ to: '/', label: 'Businesses', end: true }]

function App() {
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [authView, setAuthView] = useState('login')
  const navigate = useNavigate()

  useEffect(() => {
    if (!getToken()) {
      setCheckingSession(false)
      return
    }

    apiFetch('/user')
      .then((data) => {
        setTenantId(data.tenant_id)
        setUser(data)
      })
      .catch(() => clearToken())
      .finally(() => setCheckingSession(false))
  }, [])

  function handleLoggedIn(loggedInUser) {
    setUser(loggedInUser)
    navigate('/')
  }

  async function handleLogout() {
    try {
      await apiFetch('/logout', { method: 'POST' })
    } catch {
      // ignore — we clear the local token regardless
    }
    clearToken()
    setTenantId(null)
    setUser(null)
    setAuthView('login')
    navigate('/')
  }

  if (checkingSession) {
    return <p style={{ textAlign: 'center', marginTop: 80 }}>Loading...</p>
  }

  if (!user) {
    if (authView === 'register') {
      return <RegisterPage onRegistered={handleLoggedIn} onShowLogin={() => setAuthView('login')} />
    }
    return <Login onLoggedIn={handleLoggedIn} onShowRegister={() => setAuthView('register')} />
  }

  if (user.role === 'super_admin') {
    return (
      <Routes>
        <Route
          element={<StaffLayout user={user} onLogout={handleLogout} navLinks={SUPER_ADMIN_NAV_LINKS} />}
        >
          <Route path="/" element={<SuperAdminDashboard />} />
        </Route>
      </Routes>
    )
  }

  if (user.role === 'owner') {
    return (
      <Routes>
        <Route element={<StaffLayout user={user} onLogout={handleLogout} navLinks={OWNER_NAV_LINKS} />}>
          <Route path="/" element={<OwnerHome />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/orders/new" element={<OrderEntryPage />} />
          <Route path="/orders/history" element={<OrdersHistoryPage mode="all" />} />
          <Route path="/orders/:id/edit" element={<OrderEditPage />} />
          <Route path="/due-reminders" element={<DueReminderHistoryPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/low-stock" element={<LowStockPage />} />
          <Route path="/purchases" element={<PurchaseEntryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/staff" element={<StaffManagementPage />} />
          <Route path="/staff-activity" element={<StaffActivityPage />} />
          <Route path="/settings" element={<SettingsPage user={user} onProfileUpdated={setUser} />} />
        </Route>
      </Routes>
    )
  }

  if (user.role === 'counter_staff') {
    return (
      <Routes>
        <Route
          element={<StaffLayout user={user} onLogout={handleLogout} navLinks={COUNTER_STAFF_NAV_LINKS} />}
        >
          <Route path="/" element={<OrderEntryPage />} />
          <Route path="/orders/mine" element={<OrdersHistoryPage mode="mine" />} />
          <Route path="/orders/:id/edit" element={<OrderEditPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/settings" element={<SettingsPage user={user} onProfileUpdated={setUser} />} />
        </Route>
      </Routes>
    )
  }

  if (user.role === 'store_worker') {
    return (
      <Routes>
        <Route
          element={<StaffLayout user={user} onLogout={handleLogout} navLinks={STORE_WORKER_NAV_LINKS} />}
        >
          <Route path="/" element={<WorkerPickList user={user} />} />
          <Route path="/my-orders" element={<MyPickedOrdersPage />} />
          <Route path="/settings" element={<SettingsPage user={user} onProfileUpdated={setUser} />} />
        </Route>
      </Routes>
    )
  }

  return (
    <div style={{ maxWidth: 500, margin: '80px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 22 }}>Welcome, {user.name}</h1>
      <p style={{ color: '#555' }}>
        Logged in as: <strong>{user.role}</strong>
      </p>
      <button onClick={handleLogout} style={{ padding: '8px 16px', marginTop: 16 }}>
        Logout
      </button>
    </div>
  )
}

export default App
