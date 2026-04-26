import React, { useState } from 'react';
import {
  BarChart3, Users, TrendingUp, Clock, Download, Bot, CheckCircle2, XCircle,
  Activity, ChevronLeft, ChevronRight, Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const COLORS = ['#22d3ee', '#34d399', '#60a5fa', '#a855f7', '#fbbf24', '#f87171', '#ec4899'];

function formatTime(seconds) {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

const ACTION_LABELS = {
  lead_created: '➕ Tạo lead', lead_updated: '✏️ Cập nhật lead', lead_assigned: '👤 Assign lead',
  lead_status_changed: '🔄 Đổi status', message_sent: '💬 Gửi tin nhắn', ai_processed: '🤖 AI xử lý',
  login: '🔑 Đăng nhập', file_uploaded: '📁 Upload file', script_used: '📝 Dùng script',
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activityPage, setActivityPage] = useState(1);

  const dateParams = {};
  if (dateFrom) dateParams.date_from = dateFrom;
  if (dateTo) dateParams.date_to = dateTo;

  const { data: summary } = useQuery({
    queryKey: ['analytics', 'summary', dateParams],
    queryFn: () => analyticsService.getSummary(dateParams).then((r) => r.data),
  });

  const { data: performance } = useQuery({
    queryKey: ['analytics', 'performance'],
    queryFn: () => analyticsService.getPerformance().then((r) => r.data),
    enabled: user?.role !== 'SALES',
  });

  const { data: funnel } = useQuery({
    queryKey: ['analytics', 'funnel', dateParams],
    queryFn: () => analyticsService.getFunnel(dateParams).then((r) => r.data),
  });

  const { data: aiStatus } = useQuery({
    queryKey: ['analytics', 'ai-status'],
    queryFn: () => analyticsService.getAiStatus().then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: activityData } = useQuery({
    queryKey: ['analytics', 'activity', activityPage],
    queryFn: () => analyticsService.getActivity({ page: activityPage, per_page: 15 }).then((r) => r.data),
  });

  const pipelineData = (summary?.pipeline_distribution || []).map((p, i) => ({
    name: p.status, count: p.count, fill: COLORS[i % COLORS.length],
  }));

  const countryData = (summary?.leads_by_country || []).slice(0, 8).map((c, i) => ({
    name: c.country, count: c.count, fill: COLORS[i % COLORS.length],
  }));

  const handleExportLeads = async () => {
    try {
      const res = await analyticsService.exportLeadsCsv(dateParams);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); window.URL.revokeObjectURL(url);
      toast.success('Đã export CSV');
    } catch { toast.error('Export thất bại'); }
  };

  const handleExportPerformance = async () => {
    try {
      const res = await analyticsService.exportPerformanceCsv();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `performance_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); window.URL.revokeObjectURL(url);
      toast.success('Đã export CSV');
    } catch { toast.error('Export thất bại'); }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1.5">Báo cáo hiệu suất và insights</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportLeads} className="btn-ghost text-xs">
            <Download size={14} /> Export Leads
          </button>
          {user?.role !== 'SALES' && (
            <button onClick={handleExportPerformance} className="btn-ghost text-xs">
              <Download size={14} /> Export Performance
            </button>
          )}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="glass p-4 flex items-center gap-4 flex-wrap">
        <Calendar size={16} className="text-slate-500" />
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Từ:</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 bg-ink-950/50 rounded-lg border border-white/10 text-xs outline-none focus:border-neon-cyan/50" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Đến:</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 bg-ink-950/50 rounded-lg border border-white/10 text-xs outline-none focus:border-neon-cyan/50" />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-neon-cyan hover:underline">
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
        {[
          { label: 'Total Leads', value: summary?.total_leads ?? '—', icon: Users, tone: 'cyan' },
          { label: 'Conversion Rate', value: summary ? `${summary.conversion_rate}%` : '—', icon: TrendingUp, tone: 'green' },
          { label: 'Avg Response', value: formatTime(summary?.avg_response_time), icon: Clock, tone: 'purple' },
          { label: 'SLA Violations', value: summary?.sla_violations ?? '—', icon: BarChart3, tone: 'amber' },
        ].map((card) => (
          <div key={card.label} className="glass glass-hover p-5 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-4 transition-all duration-300 ${
              card.tone === 'cyan' ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20 group-hover:bg-neon-cyan group-hover:text-ink-950' :
              card.tone === 'green' ? 'bg-neon-green/10 text-neon-green border-neon-green/20 group-hover:bg-neon-green group-hover:text-ink-950' :
              card.tone === 'purple' ? 'bg-neon-purple/10 text-neon-purple border-neon-purple/20 group-hover:bg-neon-purple group-hover:text-ink-950' :
              'bg-neon-amber/10 text-neon-amber border-neon-amber/20 group-hover:bg-neon-amber group-hover:text-ink-950'
            }`}>
              <card.icon size={20} />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">{card.label}</p>
            <h3 className="text-2xl font-bold font-display text-white">{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6">
          <h3 className="font-bold text-lg font-display text-white mb-6">Pipeline Distribution</h3>
          <div className="h-64">
            {pipelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0b0f1d', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={800}>
                    {pipelineData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-500 text-sm">No data</div>}
          </div>
        </div>

        <div className="glass p-6">
          <h3 className="font-bold text-lg font-display text-white mb-6">Leads by Country</h3>
          <div className="h-64">
            {countryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,0.05)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#0b0f1d', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} animationDuration={800}>
                    {countryData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-500 text-sm">No data</div>}
          </div>
        </div>
      </div>

      {/* Funnel */}
      <div className="glass p-6">
        <h3 className="font-bold text-lg font-display text-white mb-6">Conversion Funnel</h3>
        <div className="space-y-4">
          {(funnel?.funnel || []).map((f, i) => {
            const maxVal = funnel?.funnel?.[0]?.count || 1;
            const pct = (f.count / maxVal) * 100;
            return (
              <div key={f.stage}>
                <div className="flex justify-between items-center text-[11px] font-bold mb-2 uppercase tracking-widest text-slate-400">
                  <span>{f.stage}</span>
                  <span className="text-white">{f.count} <span className="text-slate-600">({pct.toFixed(1)}%)</span></span>
                </div>
                <div className="h-8 bg-white/5 rounded-xl relative overflow-hidden border border-white/5">
                  <div className="h-full rounded-xl transition-all duration-1000"
                    style={{ width: `${pct}%`, backgroundColor: `${COLORS[i % COLORS.length]}40`, borderRight: `2px solid ${COLORS[i % COLORS.length]}` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sales Performance */}
      {user?.role !== 'SALES' && performance?.sales_performance && (
        <div className="glass p-6">
          <h3 className="font-bold text-lg font-display text-white mb-6">Sales Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Name</th>
                  <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Leads</th>
                  <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Won</th>
                  <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Conv %</th>
                  <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Avg Resp</th>
                  <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {performance.sales_performance.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="px-4 py-3"><p className="text-sm font-bold text-white">{p.name}</p><p className="text-[10px] font-mono text-slate-500">{p.email}</p></td>
                    <td className="px-4 py-3 text-center text-sm text-white font-mono">{p.total_leads}</td>
                    <td className="px-4 py-3 text-center text-sm text-neon-green font-mono font-bold">{p.won_leads}</td>
                    <td className="px-4 py-3 text-center text-sm text-neon-cyan font-mono">{p.conversion_rate}%</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-300 font-mono">{formatTime(p.avg_response_time)}</td>
                    <td className="px-4 py-3 text-right text-sm text-white font-mono font-bold">${p.total_value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Status */}
      <div className="glass p-6">
        <h3 className="font-bold text-lg font-display text-white mb-4 flex items-center gap-2">
          <Bot size={20} className="text-neon-purple" /> AI Service Status
        </h3>
        {aiStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-ink-950/50 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                {aiStatus.ollama_online ? <CheckCircle2 size={16} className="text-neon-green" /> : <XCircle size={16} className="text-neon-red" />}
                <span className="text-sm font-bold text-white">Ollama Server</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{aiStatus.ollama_url}</p>
              <p className={`text-xs font-bold mt-1 ${aiStatus.ollama_online ? 'text-neon-green' : 'text-neon-red'}`}>
                {aiStatus.ollama_online ? 'Online' : 'Offline'}
              </p>
            </div>
            <div className="p-4 bg-ink-950/50 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                {aiStatus.chat_model_ready ? <CheckCircle2 size={16} className="text-neon-green" /> : <XCircle size={16} className="text-neon-amber" />}
                <span className="text-sm font-bold text-white">Chat Model</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{aiStatus.chat_model}</p>
              <p className={`text-xs font-bold mt-1 ${aiStatus.chat_model_ready ? 'text-neon-green' : 'text-neon-amber'}`}>
                {aiStatus.chat_model_ready ? 'Ready' : 'Not loaded — run: ollama pull ' + aiStatus.chat_model}
              </p>
            </div>
            <div className="p-4 bg-ink-950/50 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                {aiStatus.embed_model_ready ? <CheckCircle2 size={16} className="text-neon-green" /> : <XCircle size={16} className="text-neon-amber" />}
                <span className="text-sm font-bold text-white">Embedding Model</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{aiStatus.embed_model}</p>
              <p className={`text-xs font-bold mt-1 ${aiStatus.embed_model_ready ? 'text-neon-green' : 'text-neon-amber'}`}>
                {aiStatus.embed_model_ready ? 'Ready' : 'Not loaded — run: ollama pull ' + aiStatus.embed_model}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Đang kiểm tra...</div>
        )}
      </div>

      {/* Activity Log */}
      <div className="glass p-6">
        <h3 className="font-bold text-lg font-display text-white mb-4 flex items-center gap-2">
          <Activity size={20} className="text-neon-cyan" /> Lịch sử hoạt động
        </h3>
        <div className="space-y-2">
          {(activityData?.activities || []).length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Chưa có hoạt động nào</p>
          ) : (
            (activityData?.activities || []).map((a) => (
              <div key={a.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm shrink-0">
                  {ACTION_LABELS[a.action]?.slice(0, 2) || '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    <span className="font-bold">{a.user_name || 'System'}</span>
                    {' '}{ACTION_LABELS[a.action]?.slice(2) || a.action}
                    {a.lead_id && <span className="text-slate-500"> · Lead #{a.lead_id}</span>}
                  </p>
                  {a.details && Object.keys(a.details).length > 0 && (
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {JSON.stringify(a.details).slice(0, 100)}
                    </p>
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-600 shrink-0">
                  {a.created_at ? new Date(a.created_at).toLocaleString('vi-VN') : ''}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {activityData && activityData.pages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4 mt-4 border-t border-white/5">
            <button onClick={() => setActivityPage((p) => Math.max(1, p - 1))} disabled={activityPage === 1}
              className="p-2 rounded-lg bg-ink-900/60 border border-white/5 text-slate-400 disabled:opacity-30">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-mono text-slate-400">Trang {activityPage} / {activityData.pages}</span>
            <button onClick={() => setActivityPage((p) => Math.min(activityData.pages, p + 1))} disabled={activityPage === activityData.pages}
              className="p-2 rounded-lg bg-ink-900/60 border border-white/5 text-slate-400 disabled:opacity-30">
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
