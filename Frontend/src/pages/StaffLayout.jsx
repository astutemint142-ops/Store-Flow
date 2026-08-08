import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Store,
  Home,
  Tags,
  Package,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  Truck,
  BarChart3,
  Settings,
  ClipboardList,
  Users,
  Building2,
  LogOut,
  Activity,
  ChevronsLeft,
  ChevronsRight,
  History,
  ClipboardCheck,
} from 'lucide-react'
import './StaffLayout.css'

const SIDEBAR_COLLAPSED_KEY = 'storeflow_sidebar_collapsed'

const ICONS = {
  Home,
  Categories: Tags,
  Items: Package,
  'New Order': ShoppingCart,
  'Order History': History,
  'My Orders': ClipboardCheck,
  Payments: Wallet,
  'Low Stock': AlertTriangle,
  Purchases: Truck,
  Reports: BarChart3,
  Settings,
  'Pick List': ClipboardList,
  Staff: Users,
  'Staff Activity': Activity,
  Businesses: Building2,
}

function initialsFor(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export default function StaffLayout({ user, onLogout, navLinks }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1')

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
      return next
    })
  }

  return (
    <div className="app-shell">
      <aside className={'app-sidebar' + (collapsed ? ' collapsed' : '')}>
        <div className="app-sidebar-logo">
          <span className="app-sidebar-logo-badge">
            <Store size={16} />
          </span>
          <span className="app-sidebar-logo-text">StoreFlow</span>
        </div>

        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
        </button>

        <nav className="app-nav">
          {navLinks.map((link) => {
            const Icon = ICONS[link.label] ?? Home
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                title={link.label}
                className={({ isActive }) => 'app-nav-link' + (isActive ? ' active' : '')}
              >
                <Icon size={17} />
                <span className="nav-label">{link.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="app-sidebar-footer">
          <div className="app-user">
            {user.profile_photo_url ? (
              <img src={user.profile_photo_url} alt={user.name} className="app-user-avatar" />
            ) : (
              <span className="app-user-avatar app-user-avatar-fallback">{initialsFor(user.name)}</span>
            )}
            <span className="app-user-info">
              <strong>{user.name}</strong>
              <span>{user.role.replace('_', ' ')}</span>
            </span>
          </div>
          <button className="app-logout-btn" onClick={onLogout} title="Logout">
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="app-main">
        <div className="app-main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
