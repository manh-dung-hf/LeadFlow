import React, { useState } from 'react';
import {
  Plus, Search, Shield, ShieldCheck, User, Trash2, Key, X, Loader2,
  Check, Ban, Edit3, Users,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const ROLES = ['ADMIN', 'MANAGER', 'SALES'];
const ROLE_COLORS = {
  ADMIN: 'bg-neon-red/10 text-neon-red border-neon-red/20',
  MANAGER: 'bg-neon-purple/10 text-neon-purple border-neon-purple/20',
  SALES: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20',
};
const ROLE_ICONS = { ADMIN: ShieldCheck, MANAGER: Shield, SALES: User };

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetPwUser, setResetPwUser] = useState(null);
  const [newPw, setNewPw] = useState('');

  // New user form
  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', role: 'SALES', phone: '', max_leads: 50, welcome_message: '',
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => userService.createUser(data),
    onSuccess: () => {
      toast.success('Đã tạo user mới');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      setNewUser({ name: '', email: '', password: '', role: 'SALES', phone: '', max_leads: 50, welcome_message: '' });
    },
    onError: (err) => toast.error(err.response?.data?.msg || 'Tạo thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userService.updateUser(id, data),
    onSuccess: () => {
      toast.success('Đã cập nhật');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
    },
    onError: (err) => toast.error(err.response?.data?.msg || 'Cập nhật thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: () => {
      toast.success('Đã xóa user');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(err.response?.data?.msg || 'Xóa thất bại'),
  });

  const resetPwMutation = useMutation({
    mutationFn: ({ id, pw }) => userService.resetPassword(id, pw),
    onSuccess: () => {
      toast.success('Đã reset mật khẩu');
      setResetPwUser(null);
      setNewPw('');
    },
    onError: (err) => toast.error(err.response?.data?.msg || 'Reset thất bại'),
  });

  const filtered = (users || []).filter((u) =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight">Quản lý người dùng</h1>
          <p className="text-slate-400 text-sm mt-1.5">{users?.length || 0} users · Phân quyền ADMIN / MANAGER / SALES</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} /> Thêm User
          </button>
        )}
      </div>

      {/* Search */}
      <div className="glass p-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full pl-11 pr-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/5 focus:border-neon-cyan/50 outline-none text-sm" />
        </div>
      </div>

      {/* User Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="glass overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">User</th>
                <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Vai trò</th>
                <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Trạng thái</th>
                <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Leads</th>
                <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Ngày tạo</th>
                <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((u) => {
                const RoleIcon = ROLE_ICONS[u.role] || User;
                return (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-ink-950 font-bold text-xs">
                          {u.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{u.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${ROLE_COLORS[u.role]}`}>
                        <RoleIcon size={10} /> {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-neon-green text-[10px] font-bold"><Check size={10} /> Active</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 text-[10px] font-bold"><Ban size={10} /> Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-sm text-white">
                      {u.current_lead_count || 0} / {u.max_leads || 50}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditUser({ ...u })} className="p-2 text-slate-400 hover:text-neon-cyan rounded-lg hover:bg-white/5 transition-all" title="Sửa">
                          <Edit3 size={14} />
                        </button>
                        {isAdmin && (
                          <>
                            <button onClick={() => setResetPwUser(u)} className="p-2 text-slate-400 hover:text-neon-amber rounded-lg hover:bg-white/5 transition-all" title="Reset mật khẩu">
                              <Key size={14} />
                            </button>
                            {u.id !== currentUser?.id && (
                              <>
                                <button
                                  onClick={() => updateMutation.mutate({ id: u.id, data: { is_active: !u.is_active } })}
                                  className={`p-2 rounded-lg hover:bg-white/5 transition-all ${u.is_active ? 'text-slate-400 hover:text-neon-amber' : 'text-slate-400 hover:text-neon-green'}`}
                                  title={u.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                >
                                  {u.is_active ? <Ban size={14} /> : <Check size={14} />}
                                </button>
                                <button
                                  onClick={() => { if (confirm(`Xóa user ${u.name}?`)) deleteMutation.mutate(u.id); }}
                                  className="p-2 text-slate-400 hover:text-neon-red rounded-lg hover:bg-white/5 transition-all" title="Xóa"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Permission Legend */}
      <div className="glass p-6">
        <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2"><Shield size={16} className="text-neon-purple" /> Phân quyền</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { role: 'ADMIN', desc: 'Toàn quyền: quản lý user, xem tất cả lead, analytics, cấu hình hệ thống, xóa dữ liệu' },
            { role: 'MANAGER', desc: 'Xem tất cả lead, analytics, assign lead, quản lý scripts & knowledge base' },
            { role: 'SALES', desc: 'Chỉ xem lead được assign, trả lời tin nhắn, sử dụng scripts' },
          ].map((r) => (
            <div key={r.role} className="p-4 bg-ink-950/50 rounded-xl border border-white/5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase border mb-2 ${ROLE_COLORS[r.role]}`}>{r.role}</span>
              <p className="text-xs text-slate-400 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="glass w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-display text-white">Thêm User Mới</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(newUser); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Họ tên *</label>
                  <input value={newUser.name} onChange={(e) => setNewUser((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm" />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input value={newUser.email} onChange={(e) => setNewUser((f) => ({ ...f, email: e.target.value }))} type="email"
                    className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Mật khẩu *</label>
                  <input value={newUser.password} onChange={(e) => setNewUser((f) => ({ ...f, password: e.target.value }))} type="password" placeholder="Tối thiểu 6 ký tự"
                    className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm" />
                </div>
                <div>
                  <label className="label">Vai trò *</label>
                  <select value={newUser.role} onChange={(e) => setNewUser((f) => ({ ...f, role: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm">
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Số điện thoại</label>
                  <input value={newUser.phone} onChange={(e) => setNewUser((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm" />
                </div>
                <div>
                  <label className="label">Max Leads</label>
                  <input value={newUser.max_leads} onChange={(e) => setNewUser((f) => ({ ...f, max_leads: parseInt(e.target.value) || 50 }))} type="number"
                    className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="label">Lời chào mặc định</label>
                <textarea value={newUser.welcome_message} onChange={(e) => setNewUser((f) => ({ ...f, welcome_message: e.target.value }))} rows={2}
                  placeholder="Xin chào! Tôi là..."
                  className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-slate-400 text-sm font-bold">Hủy</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary disabled:opacity-50">
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditUser(null)}>
          <div className="glass w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-display text-white">Sửa User: {editUser.name}</h2>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: editUser.id, data: editUser }); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Họ tên</label>
                  <input value={editUser.name || ''} onChange={(e) => setEditUser((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input value={editUser.email || ''} onChange={(e) => setEditUser((f) => ({ ...f, email: e.target.value }))} type="email"
                    className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {isAdmin && (
                  <div>
                    <label className="label">Vai trò</label>
                    <select value={editUser.role} onChange={(e) => setEditUser((f) => ({ ...f, role: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm">
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="label">Max Leads</label>
                  <input value={editUser.max_leads || 50} onChange={(e) => setEditUser((f) => ({ ...f, max_leads: parseInt(e.target.value) || 50 }))} type="number"
                    className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="label">Số điện thoại</label>
                <input value={editUser.phone || ''} onChange={(e) => setEditUser((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm" />
              </div>
              <div>
                <label className="label">Lời chào</label>
                <textarea value={editUser.welcome_message || ''} onChange={(e) => setEditUser((f) => ({ ...f, welcome_message: e.target.value }))} rows={2}
                  className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditUser(null)} className="px-5 py-2.5 text-slate-400 text-sm font-bold">Hủy</button>
                <button type="submit" disabled={updateMutation.isPending} className="btn-primary disabled:opacity-50">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPwUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setResetPwUser(null)}>
          <div className="glass w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-4">Reset mật khẩu: {resetPwUser.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Mật khẩu mới</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setResetPwUser(null)} className="px-5 py-2.5 text-slate-400 text-sm font-bold">Hủy</button>
                <button
                  onClick={() => resetPwMutation.mutate({ id: resetPwUser.id, pw: newPw })}
                  disabled={resetPwMutation.isPending || newPw.length < 6}
                  className="btn-primary disabled:opacity-50"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
