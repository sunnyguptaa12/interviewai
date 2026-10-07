import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, Moon, Sun, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Compass, FileText, FolderOpen, MessageSquare, Briefcase, BarChart3, ListChecks, Bell, Shield } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/resume', label: 'Resume', icon: FileText },
  { to: '/questions', label: 'Questions', icon: FolderOpen },
  { to: '/mock-interview', label: 'Mock interview', icon: MessageSquare },
  { to: '/job-match', label: 'Job match', icon: Briefcase },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/learning-plan', label: 'Prep plan', icon: ListChecks },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('ip_sidebar_collapsed') === 'true');
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    api.get('/notifications/unread-count').then((r) => setUnread(r.data.data.unread)).catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const toggleSidebar = () => setSidebarCollapsed((collapsed) => {
    const next = !collapsed;
    localStorage.setItem('ip_sidebar_collapsed', String(next));
    return next;
  });

  return (
    <div className="min-h-screen lg:flex">
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-200 bg-white p-4 transition-all dark:border-neutral-800 dark:bg-neutral-950 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'} ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`mb-6 flex items-center gap-2 px-2 text-lg font-semibold text-brand-600 ${sidebarCollapsed ? 'lg:justify-center' : ''}`}>
          <Compass size={22} /> {!sidebarCollapsed && 'Interview Platform'}
        </div>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''} ${isActive ? 'bg-brand-50 font-medium text-brand-700 dark:bg-neutral-900 dark:text-brand-500' : 'text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-900'}`}>
              <Icon size={18} /> {(!sidebarCollapsed || open) && label}
            </NavLink>
          ))}
        {user?.role === 'admin' && (
          <NavLink to="/admin" onClick={() => setOpen(false)} title={sidebarCollapsed ? 'Admin' : undefined} className={({ isActive }) => `mt-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''} ${isActive ? 'bg-brand-50 font-medium text-brand-700 dark:bg-neutral-900' : 'text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-900'}`}><Shield size={18} /> {(!sidebarCollapsed || open) && 'Admin'}</NavLink>
        )}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-2">
            <button className="btn-ghost lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
            <button className="btn-ghost hidden lg:inline-flex" onClick={toggleSidebar} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>
            <span className="hidden text-sm text-slate-500 lg:block">Welcome, {user?.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <NavLink to="/notifications" className="btn-ghost relative" aria-label="Notifications"><Bell size={18} />{unread > 0 && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-red-500 px-1.5 text-[10px] text-white">{unread}</span>}</NavLink>
            <button className="btn-ghost" onClick={toggle} aria-label="Toggle theme">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button className="btn-ghost" onClick={handleLogout}><LogOut size={18} /> Logout</button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
