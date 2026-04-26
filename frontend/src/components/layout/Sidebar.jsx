import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  MessageSquare,
  BarChart3,
  LogOut,
  Zap,
  UserCog,
  UserCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../hooks/useAuth';

const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Leads', path: '/leads' },
  { icon: BookOpen, label: 'Knowledge Base', path: '/knowledge' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics', hideFor: ['SALES'] },
  { icon: MessageSquare, label: 'Scripts', path: '/scripts' },
  { icon: UserCog, label: 'Quản lý User', path: '/users', hideFor: ['SALES'] },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  const avatarSrc = user?.avatar_url ? `${API_HOST}${user.avatar_url}` : null;

  return (
    <aside className="w-64 backdrop-blur-2xl bg-ink-950/70 border-r border-white/10 flex flex-col relative z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-xl flex items-center justify-center shadow-lg shadow-neon-cyan/20">
          <Zap className="text-ink-950 fill-ink-950" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold font-display tracking-tight text-white">LeadFlow</h1>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neon-cyan font-mono leading-none">AI · v2.4</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <div className="px-4 mb-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">Workspace</div>
        {menuItems.map((item) => {
          if (item.hideFor?.includes(user?.role)) return null;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx('sidebar-item', isActive && 'active')}
            >
              <item.icon size={18} />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-2">
        {/* Profile link */}
        <NavLink
          to="/profile"
          className={({ isActive }) => clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
            isActive ? 'bg-white/5 border border-white/10' : 'hover:bg-white/5'
          )}
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-ink-950 font-bold text-xs border border-white/10">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] font-mono text-slate-500">{user?.role}</p>
          </div>
        </NavLink>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
