import React, { useState, useRef } from 'react';
import {
  User, Mail, Phone, Lock, Camera, Save, Loader2, MessageSquare, Shield,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/api';
import toast from 'react-hot-toast';

const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';

export default function ProfilePage() {
  const { user, login: refreshUser } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    welcome_message: user?.welcome_message || '',
  });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setPw = (key) => (e) => setPwForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Tên không được để trống'); return; }
    setSaving(true);
    try {
      const res = await authService.updateProfile(form);
      localStorage.setItem('user', JSON.stringify(res.data));
      toast.success('Đã cập nhật thông tin');
      // Force re-render auth context
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Cập nhật thất bại');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password.length < 6) { toast.error('Mật khẩu mới tối thiểu 6 ký tự'); return; }
    if (pwForm.new_password !== pwForm.confirm) { toast.error('Mật khẩu xác nhận không khớp'); return; }
    setSavingPw(true);
    try {
      await authService.changePassword({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      toast.success('Đã đổi mật khẩu');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Đổi mật khẩu thất bại');
    } finally { setSavingPw(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File tối đa 5MB'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await authService.uploadAvatar(fd);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Đã cập nhật ảnh đại diện');
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Upload thất bại');
    } finally { setUploading(false); }
    e.target.value = '';
  };

  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const avatarSrc = user?.avatar_url ? `${API_HOST}${user.avatar_url}` : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700 pb-10">
      <div>
        <h1 className="text-3xl font-bold font-display text-white tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-slate-400 text-sm mt-1.5">Cập nhật thông tin, ảnh đại diện và mật khẩu</p>
      </div>

      {/* Avatar */}
      <div className="glass p-8 flex items-center gap-8">
        <div className="relative group">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover border-2 border-white/10" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-ink-950 font-bold text-3xl border-2 border-white/10">
              {initials}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            {uploading ? <Loader2 size={24} className="text-white animate-spin" /> : <Camera size={24} className="text-white" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
            user?.role === 'ADMIN' ? 'bg-neon-red/10 text-neon-red border border-neon-red/20' :
            user?.role === 'MANAGER' ? 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20' :
            'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20'
          }`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="glass p-8 space-y-6">
        <div className="flex items-center gap-2 text-neon-cyan mb-2">
          <User size={20} />
          <h3 className="font-bold text-lg">Thông tin cá nhân</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label">Họ tên *</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input value={form.name} onChange={set('name')}
                className="w-full pl-11 pr-4 py-3 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="label">Email *</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input value={form.email} onChange={set('email')} type="email"
                className="w-full pl-11 pr-4 py-3 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="label">Số điện thoại</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input value={form.phone} onChange={set('phone')}
                className="w-full pl-11 pr-4 py-3 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 outline-none text-sm" />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Lời chào mặc định</label>
          <p className="text-xs text-slate-500 mb-2">Tin nhắn chào mừng tự động khi bạn được assign lead mới</p>
          <div className="relative">
            <MessageSquare className="absolute left-4 top-3.5 text-slate-500" size={16} />
            <textarea value={form.welcome_message} onChange={set('welcome_message')} rows={3}
              placeholder="Xin chào! Tôi là {{name}}, rất vui được hỗ trợ bạn..."
              className="w-full pl-11 pr-4 py-3 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 outline-none text-sm resize-none" />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Lưu thông tin
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="glass p-8 space-y-6">
        <div className="flex items-center gap-2 text-neon-amber mb-2">
          <Lock size={20} />
          <h3 className="font-bold text-lg">Đổi mật khẩu</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="label">Mật khẩu hiện tại</label>
            <input type="password" value={pwForm.current_password} onChange={setPw('current_password')}
              className="w-full px-4 py-3 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-amber/50 outline-none text-sm" />
          </div>
          <div>
            <label className="label">Mật khẩu mới</label>
            <input type="password" value={pwForm.new_password} onChange={setPw('new_password')}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full px-4 py-3 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-amber/50 outline-none text-sm" />
          </div>
          <div>
            <label className="label">Xác nhận mật khẩu</label>
            <input type="password" value={pwForm.confirm} onChange={setPw('confirm')}
              className="w-full px-4 py-3 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-amber/50 outline-none text-sm" />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={savingPw} className="px-8 py-3 bg-neon-amber/10 text-neon-amber border border-neon-amber/20 rounded-xl font-bold text-sm hover:bg-neon-amber/20 transition-all disabled:opacity-50 flex items-center gap-2">
            {savingPw ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            Đổi mật khẩu
          </button>
        </div>
      </form>

      {/* Account Info */}
      <div className="glass p-6 flex items-start gap-4">
        <Shield size={20} className="text-slate-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-500 leading-relaxed">
          <p>Vai trò: <span className="text-white font-bold">{user?.role}</span> · Tạo ngày: {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '—'}</p>
          <p className="mt-1">Lead đang xử lý: {user?.current_lead_count || 0} / {user?.max_leads || 50} · Liên hệ Admin để thay đổi vai trò hoặc giới hạn lead.</p>
        </div>
      </div>
    </div>
  );
}
