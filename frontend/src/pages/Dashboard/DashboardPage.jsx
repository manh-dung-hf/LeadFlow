import React from 'react';
import {
  Users, Clock, TrendingUp, DollarSign, Plus, AlertTriangle,
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { analyticsService, leadService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { StatCard, PageHeader, SkeletonKPI } from '../../components/ui';
import StatusDot from '../../components/ui/StatusDot';

const COLORS = ['#22d3ee', '#34d399', '#60a5fa', '#a855f7', '#fbbf24', '#f87171'];

function formatTime(seconds) {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: summary } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsService.getSummary().then((r) => r.data),
  });

  const { data: trends } = useQuery({
    queryKey: ['analytics', 'trends'],
    queryFn: () => analyticsService.getTrends(30).then((r) => r.data),
  });

  const { data: funnel } = useQuery({
    queryKey: ['analytics', 'funnel'],
    queryFn: () => analyticsService.getFunnel().then((r) => r.data),
  });

  const { data: slaLeads } = useQuery({
    queryKey: ['leads', 'sla'],
    queryFn: () => leadService.getLeads({ status: 'NEW', per_page: 5 }).then((r) => r.data),
  });

  const kpiData = [
    { id: 'leads', label: 'Total Leads', value: summary?.total_leads ?? '—', tone: 'cyan', icon: Users },
    { id: 'response', label: 'Avg Response', value: formatTime(summary?.avg_response_time), tone: 'green', icon: Clock },
    { id: 'conversion', label: 'Conversion', value: summary ? `${summary.conversion_rate}%` : '—', tone: 'purple', icon: TrendingUp },
    { id: 'pipeline', label: 'Pipeline Value', value: summary ? `$${(summary.total_pipeline_value || 0).toLocaleString()}` : '—', tone: 'amber', icon: DollarSign },
  ];

  const channelData = (summary?.leads_by_source || []).map((s, i) => ({
    name: s.source,
    value: s.count,
    color: COLORS[i % COLORS.length],
  }));

  const funnelData = (funnel?.funnel || []).map((f, i) => ({
    stage: f.stage,
    value: f.count,
    color: COLORS[i % COLORS.length],
  }));

  const trendData = (trends?.daily_trend || []).map((d) => ({
    name: d.date?.slice(5) || '',
    new: d.new,
    converted: d.converted,
  }));

  return (
    <div className="space-y-8 pb-10">
      <PageHeader title="Dashboard" description={
        <span className="flex items-center gap-2">Real-time overview <StatusDot status="online" pulse /></span>
      }>
        <button onClick={() => navigate('/leads')} className="btn-primary">
          <Plus size={16} /> New Lead
        </button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
        {summary ? kpiData.map((k) => <StatCard key={k.id} {...k} />) : (
          <>
            <SkeletonKPI /><SkeletonKPI /><SkeletonKPI /><SkeletonKPI />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 glass p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-bold text-lg font-display text-white">Leads Trend</h3>
              <p className="text-xs text-slate-500 mt-1">New vs converted · last 30 days</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_8px_#22d3ee]" /> New</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-neon-purple shadow-[0_0_8px_#a855f7]" /> Converted</span>
            </div>
          </div>
          <div className="h-72 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0b0f1d', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Area type="monotone" dataKey="new" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorNew)" dot={false} />
                  <Area type="monotone" dataKey="converted" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorConv)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No trend data yet</div>
            )}
          </div>
        </div>

        {/* Channel Mix */}
        <div className="glass p-6">
          <h3 className="font-bold text-lg font-display text-white mb-8">Channel Mix</h3>
          <div className="h-52 w-full">
            {channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {channelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0b0f1d', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No data</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {channelData.map((c) => (
              <div key={c.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-[11px] font-bold text-slate-400">{c.name}</span>
                <span className="text-[11px] font-mono text-white ml-auto">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Funnel + SLA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel */}
        <div className="lg:col-span-2 glass p-6">
          <h3 className="font-bold text-lg font-display text-white mb-6">Conversion Funnel</h3>
          <div className="space-y-4">
            {funnelData.map((f) => {
              const maxVal = funnelData[0]?.value || 1;
              const pct = (f.value / maxVal) * 100;
              return (
                <div key={f.stage}>
                  <div className="flex justify-between items-center text-[11px] font-bold mb-2 uppercase tracking-widest text-slate-400">
                    <span>{f.stage}</span>
                    <span className="text-white">{f.value} <span className="text-slate-600">({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="h-8 bg-white/5 rounded-xl relative overflow-hidden border border-white/5">
                    <div
                      className="h-full rounded-xl transition-all duration-1000"
                      style={{ width: `${pct}%`, backgroundColor: `${f.color}40`, borderRight: `2px solid ${f.color}` }}
                    />
                  </div>
                </div>
              );
            })}
            {funnelData.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">No funnel data yet</p>
            )}
          </div>
        </div>

        {/* SLA Alerts */}
        <div className="glass p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg font-display text-white">SLA Alerts</h3>
            {summary?.sla_violations > 0 && (
              <span className="tag tag--hot">
                <AlertTriangle size={10} /> {summary.sla_violations}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {(slaLeads?.leads || []).map((lead) => {
              const age = lead.created_at ? Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 60000) : 0;
              const level = age > 10 ? 'danger' : age > 5 ? 'warn' : 'ok';
              return (
                <div
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    level === 'danger' ? 'bg-neon-red/10 text-neon-red' : level === 'warn' ? 'bg-neon-amber/10 text-neon-amber' : 'bg-neon-green/10 text-neon-green'
                  }`}>
                    <Clock size={16} className={level === 'danger' ? 'animate-pulse' : ''} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{lead.name}</p>
                    <p className="text-[10px] font-mono text-slate-500">{lead.source} · {lead.temperature}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold font-mono ${level === 'danger' ? 'text-neon-red' : level === 'warn' ? 'text-neon-amber' : 'text-neon-green'}`}>
                      {age}m
                    </p>
                  </div>
                </div>
              );
            })}
            {(!slaLeads?.leads || slaLeads.leads.length === 0) && (
              <p className="text-slate-500 text-sm text-center py-4">No pending leads</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
