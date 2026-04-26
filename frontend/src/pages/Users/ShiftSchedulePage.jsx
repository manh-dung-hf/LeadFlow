import React, { useState } from 'react';
import {
  Clock, Plus, Trash2, Zap, Users, ChevronLeft, Settings, X, Loader2, Check,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftService, userService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const COLORS = [
  'bg-sky-500/20 border-sky-500/40 text-sky-300',
  'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
  'bg-violet-500/20 border-violet-500/40 text-violet-300',
  'bg-amber-500/20 border-amber-500/40 text-amber-300',
  'bg-rose-500/20 border-rose-500/40 text-rose-300',
  'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
  'bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-300',
];

export default function ShiftSchedulePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showAutoGen, setShowAutoGen] = useState(false);
  const [newShift, setNewShift] = useState({ user_id: '', day_of_week: 0, start_hour: 8, end_hour: 12 });
  const [autoConfig, setAutoConfig] = useState({ start_hour: 0, end_hour: 24, hours_per_shift: 8 });

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => shiftService.getShifts().then((r) => r.data),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers().then((r) => r.data),
  });

  const { data: onDuty } = useQuery({
    queryKey: ['shifts', 'on-duty'],
    queryFn: () => shiftService.getOnDuty().then((r) => r.data),
    refetchInterval: 60000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => shiftService.createShift(data),
    onSuccess: () => { toast.success('Đã thêm ca'); queryClient.invalidateQueries({ queryKey: ['shifts'] }); setShowAdd(false); },
    onError: (err) => toast.error(err.response?.data?.msg || 'Lỗi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => shiftService.deleteShift(id),
    onSuccess: () => { toast.success('Đã xóa'); queryClient.invalidateQueries({ queryKey: ['shifts'] }); },
  });

  const autoGenMutation = useMutation({
    mutationFn: (data) => shiftService.autoGenerate(data),
    onSuccess: (res) => { toast.success(res.data.msg); queryClient.invalidateQueries({ queryKey: ['shifts'] }); setShowAutoGen(false); },
    onError: (err) => toast.error(err.response?.data?.msg || 'Lỗi'),
  });

  // Build user color map
  const userColorMap = {};
  (users || []).forEach((u, i) => { userColorMap[u.id] = COLORS[i % COLORS.length]; });

  // Build grid data: shifts grouped by day
  const grid = DAYS.map((_, dayIdx) =>
    (shifts || []).filter((s) => s.day_of_week === dayIdx).sort((a, b) => a.start_hour - b.start_hour)
  );

  const salesUsers = (users || []).filter((u) => u.role !== 'ADMIN' && u.is_active);
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight">Lịch phân ca</h1>
          <p className="text-slate-400 text-sm mt-1.5">
            {shifts?.length || 0} ca · {salesUsers.length} staff
            {onDuty?.on_duty?.length > 0 && (
              <span className="text-neon-green ml-2">
                · 🟢 {onDuty.on_duty.length} đang trực ({onDuty.current_time})
              </span>
            )}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setShowAutoGen(true)} className="btn-ghost text-xs">
              <Zap size={14} /> Tự động phân ca
            </button>
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus size={14} /> Thêm ca
            </button>
          </div>
        )}
      </div>

      {/* On-duty banner */}
      {onDuty?.on_duty?.length > 0 && (
        <div className="glass p-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span className="text-sm font-bold text-white">Đang trực:</span>
          </div>
          {onDuty.on_duty.map((s) => (
            <span key={s.id} className={`px-3 py-1 rounded-lg text-xs font-bold border ${userColorMap[s.user_id] || COLORS[0]}`}>
              {s.user_name} ({s.shift_label})
            </span>
          ))}
        </div>
      )}

      {/* Schedule Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass p-6 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header row */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest py-2">Giờ</div>
              {DAYS.map((day, i) => (
                <div key={i} className="text-center">
                  <span className={`text-xs font-bold ${i >= 5 ? 'text-neon-amber' : 'text-white'}`}>{day}</span>
                </div>
              ))}
            </div>

            {/* Time slots */}
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-8 gap-2 mb-1">
                <div className="text-[10px] font-mono text-slate-600 py-2 text-right pr-2">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {DAYS.map((_, dayIdx) => {
                  const shift = grid[dayIdx].find((s) => s.start_hour <= hour && s.end_hour > hour);
                  const isStart = shift && shift.start_hour === hour;

                  if (shift && isStart) {
                    const height = (shift.end_hour - shift.start_hour);
                    return (
                      <div
                        key={dayIdx}
                        className={`rounded-lg border px-2 py-1 relative group cursor-default transition-all hover:scale-[1.02] ${userColorMap[shift.user_id] || COLORS[0]}`}
                        style={{ gridRow: `span 1` }}
                      >
                        <div className="text-[10px] font-bold truncate">{shift.user_name}</div>
                        <div className="text-[9px] opacity-70">{shift.shift_label}</div>
                        {isAdmin && (
                          <button
                            onClick={() => deleteMutation.mutate(shift.id)}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded bg-black/30 hover:bg-red-500/50 transition-all"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    );
                  } else if (shift) {
                    return <div key={dayIdx} />;
                  }
                  return (
                    <div key={dayIdx} className="rounded-lg border border-white/5 bg-white/[0.02] min-h-[32px]" />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff Legend */}
      <div className="glass p-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Staff</h3>
        <div className="flex flex-wrap gap-2">
          {salesUsers.map((u) => (
            <span key={u.id} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${userColorMap[u.id] || COLORS[0]}`}>
              {u.name} · {(shifts || []).filter((s) => s.user_id === u.id).length} ca
            </span>
          ))}
        </div>
      </div>

      {/* Add Shift Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="glass w-full max-w-md mx-4 p-6 modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Thêm ca làm việc</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ ...newShift, user_id: parseInt(newShift.user_id) }); }} className="space-y-4">
              <div>
                <label className="label">Staff</label>
                <select value={newShift.user_id} onChange={(e) => setNewShift((f) => ({ ...f, user_id: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm">
                  <option value="">Chọn staff...</option>
                  {salesUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Ngày</label>
                <select value={newShift.day_of_week} onChange={(e) => setNewShift((f) => ({ ...f, day_of_week: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm">
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Bắt đầu</label>
                  <select value={newShift.start_hour} onChange={(e) => setNewShift((f) => ({ ...f, start_hour: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm">
                    {HOURS.map((h) => <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Kết thúc</label>
                  <select value={newShift.end_hour} onChange={(e) => setNewShift((f) => ({ ...f, end_hour: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm">
                    {HOURS.filter((h) => h > newShift.start_hour).map((h) => <option key={h} value={h}>{h.toString().padStart(2, '0')}:00</option>)}
                  </select>
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl text-xs text-slate-400">
                Ca: {newShift.end_hour - newShift.start_hour} tiếng · {DAYS[newShift.day_of_week]} {newShift.start_hour.toString().padStart(2, '0')}:00 - {newShift.end_hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-slate-400 text-sm font-bold">Hủy</button>
                <button type="submit" disabled={createMutation.isPending || !newShift.user_id} className="btn-primary disabled:opacity-50">
                  {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto Generate Modal */}
      {showAutoGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm modal-overlay" onClick={() => setShowAutoGen(false)}>
          <div className="glass w-full max-w-md mx-4 p-6 modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Tự động phân ca</h2>
              <button onClick={() => setShowAutoGen(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-neon-amber/5 border border-neon-amber/20 rounded-xl text-xs text-neon-amber">
                ⚠️ Sẽ XÓA tất cả ca hiện tại và tạo lại từ đầu. Phân đều cho {salesUsers.length} staff.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Giờ bắt đầu ngày</label>
                  <select value={autoConfig.start_hour} onChange={(e) => setAutoConfig((f) => ({ ...f, start_hour: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm">
                    {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Giờ kết thúc ngày</label>
                  <select value={autoConfig.end_hour} onChange={(e) => setAutoConfig((f) => ({ ...f, end_hour: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm">
                    {[...HOURS.filter((h) => h > autoConfig.start_hour), 24].map((h) => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Số tiếng mỗi ca</label>
                <select value={autoConfig.hours_per_shift} onChange={(e) => setAutoConfig((f) => ({ ...f, hours_per_shift: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm">
                  {[2, 3, 4, 6, 8].map((h) => <option key={h} value={h}>{h} tiếng</option>)}
                </select>
              </div>
              <div className="p-3 bg-white/5 rounded-xl text-xs text-slate-400">
                Mỗi ngày: {autoConfig.start_hour}:00 → {autoConfig.end_hour}:00 = {autoConfig.end_hour - autoConfig.start_hour}h ÷ {autoConfig.hours_per_shift}h/ca = {Math.floor((autoConfig.end_hour - autoConfig.start_hour) / autoConfig.hours_per_shift)} ca/ngày × 7 ngày = {Math.floor((autoConfig.end_hour - autoConfig.start_hour) / autoConfig.hours_per_shift) * 7} ca tổng
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAutoGen(false)} className="px-5 py-2.5 text-slate-400 text-sm font-bold">Hủy</button>
                <button onClick={() => autoGenMutation.mutate(autoConfig)} disabled={autoGenMutation.isPending} className="btn-primary disabled:opacity-50">
                  {autoGenMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} Tạo ca tự động
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
