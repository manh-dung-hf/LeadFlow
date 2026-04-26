import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { notificationService } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';

const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';

export default function Topbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { on } = useSocket(user?.id);
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const panelRef = useRef(null);

  // Fetch unread count
  useEffect(() => {
    notificationService.getUnreadCount()
      .then((res) => setUnreadCount(res.data.unread_count))
      .catch(() => {});
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    const unsub1 = on('notification', (data) => {
      setUnreadCount((c) => c + 1);
      setNotifications((prev) => [data, ...prev]);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries();
    });

    const unsub2 = on('lead_created', () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    });

    const unsub3 = on('lead_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    });

    const unsub4 = on('sla_update', () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    });

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [on, queryClient]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleNotifs = async () => {
    if (!showNotifs) {
      try {
        const res = await notificationService.getNotifications({ per_page: 10 });
        setNotifications(res.data.notifications);
      } catch {
        // ignore
      }
    }
    setShowNotifs(!showNotifs);
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase()
    : '?';

  return (
    <header className="h-16 border-b border-white/10 bg-ink-950/50 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="relative w-96 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-neon-cyan transition-colors" size={16} />
        <input
          type="text"
          placeholder="Search leads, products, docs... (⌘K)"
          className="w-full pl-10 pr-4 py-2 bg-ink-900/60 rounded-xl border border-white/5 focus:border-neon-cyan/50 focus:ring-4 focus:ring-neon-cyan/5 transition-all outline-none text-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={toggleNotifs}
            className="p-2.5 bg-ink-900/60 border border-white/5 text-slate-400 hover:text-white hover:bg-neon-cyan/5 hover:border-neon-cyan/30 rounded-xl transition-all relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-neon-red rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 glass rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h3 className="text-sm font-bold text-white">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-bold text-neon-cyan hover:underline">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)} className="text-slate-500 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500 text-center">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!n.is_read ? 'bg-neon-cyan/5' : ''}`}
                    >
                      <p className="text-xs font-bold text-white">{n.title}</p>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                      <p className="text-[9px] font-mono text-slate-600 mt-1">
                        {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-white/10 cursor-pointer" onClick={() => navigate('/profile')}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{user?.name || 'User'}</p>
            <p className="text-[11px] text-slate-500 font-mono">{user?.role}</p>
          </div>
          {user?.avatar_url ? (
            <img src={`${API_HOST}${user.avatar_url}`} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white/10" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-ink-950 font-bold text-xs border-2 border-white/10">
              {initials}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
