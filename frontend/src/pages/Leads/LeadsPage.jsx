import React, { useState, useRef } from 'react';
import {
  Plus, Search, LayoutGrid, List, Clock, Download, Upload, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService, fileService } from '../../services/api';
import toast from 'react-hot-toast';
import CreateLeadModal from './CreateLeadModal';

const STATUSES = ['NEW', 'CONTACTED', 'WHATSAPP_MOVED', 'QUOTED', 'NEGOTIATION', 'WON', 'LOST'];
const STATUS_COLORS = {
  NEW: 'text-neon-blue', CONTACTED: 'text-neon-cyan', WHATSAPP_MOVED: 'text-neon-green',
  QUOTED: 'text-neon-purple', NEGOTIATION: 'text-neon-amber', WON: 'text-neon-green', LOST: 'text-slate-500',
};
const filterChips = ['All', 'HOT', 'WARM', 'COLD'];

const LeadCard = ({ lead, onClick, onDragStart }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, lead)}
    onClick={onClick}
    className="glass glass-hover p-4 cursor-pointer group"
  >
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-ink-950 font-bold text-[10px]">
          {lead.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <h4 className="font-bold text-sm text-white group-hover:text-neon-cyan transition-colors">{lead.name}</h4>
          <p className="text-[10px] font-mono text-slate-500">#{lead.id}</p>
        </div>
      </div>
      <span className={`tag tag--${lead.temperature?.toLowerCase() || 'neutral'}`}>{lead.temperature}</span>
    </div>
    <p className="text-xs text-slate-400 truncate mb-3">{lead.country || 'Unknown'} · {lead.source}</p>
    <div className="flex items-center justify-between pt-3 border-t border-white/5">
      <div className="font-mono text-xs font-bold text-white">
        {lead.estimated_value ? `$${lead.estimated_value.toLocaleString()}` : '—'}
      </div>
      <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
        <Clock size={10} className="text-neon-cyan" />
        {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
      </div>
    </div>
  </div>
);

export default function LeadsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState('kanban');
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const fileInputRef = useRef(null);
  const dragItem = useRef(null);

  // Fetch leads for list view
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', { page, search, temperature: activeFilter !== 'All' ? activeFilter : undefined }],
    queryFn: () => leadService.getLeads({
      page,
      per_page: 20,
      search: search || undefined,
      temperature: activeFilter !== 'All' ? activeFilter : undefined,
    }).then((r) => r.data),
  });

  // Fetch pipeline for kanban view
  const { data: pipeline } = useQuery({
    queryKey: ['leads', 'pipeline'],
    queryFn: () => leadService.getPipeline().then((r) => r.data),
    enabled: view === 'kanban',
  });

  // Update lead mutation (for drag-and-drop)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => leadService.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  // File upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fileService.uploadLeads(formData);
      toast.success(`Uploaded ${res.data.uploaded} leads`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    }
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragStart = (e, lead) => {
    dragItem.current = lead;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const lead = dragItem.current;
    if (lead && lead.status !== newStatus) {
      updateMutation.mutate({ id: lead.id, data: { status: newStatus } });
      toast.success(`${lead.name} → ${newStatus}`);
    }
    dragItem.current = null;
  };

  const leads = leadsData?.leads || [];
  const totalPages = leadsData?.pages || 1;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-white">Lead Management</h1>
          <p className="text-slate-400 text-sm mt-1.5">
            {leadsData?.total ?? 0} total leads
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-ink-900/60 p-1 rounded-xl border border-white/5 flex gap-1">
            <button onClick={() => setView('kanban')} className={`p-2 rounded-lg transition-all ${view === 'kanban' ? 'bg-neon-cyan/10 text-neon-cyan' : 'text-slate-500'}`}>
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-neon-cyan/10 text-neon-cyan' : 'text-slate-500'}`}>
              <List size={18} />
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx,.xls,.csv" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-ink-900/60 border border-white/5 text-slate-300 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-white/5 transition-all">
            <Upload size={14} /> Import
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} /> New Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-5">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, company, email..."
              className="w-full pl-11 pr-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/5 focus:border-neon-cyan/50 focus:ring-4 focus:ring-neon-cyan/5 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {filterChips.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveFilter(cat); setPage(1); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border ${
                  activeFilter === cat
                    ? 'bg-neon-cyan/10 text-white border-neon-cyan/40'
                    : 'bg-transparent text-slate-500 border-white/5 hover:border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' ? (
        <div className="flex-1 overflow-x-auto pb-4 no-scrollbar">
          <div className="flex gap-5 h-full min-w-max">
            {STATUSES.map((status) => {
              const statusLeads = pipeline?.[status] || [];
              return (
                <div
                  key={status}
                  className="flex flex-col gap-3 w-[280px]"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  <div className="flex justify-between items-center px-2 py-1 border-b border-white/10 border-dashed mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} style={{ backgroundColor: 'currentColor' }} />
                      <h3 className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-300">{status.replace('_', ' ')}</h3>
                      <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{statusLeads.length}</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                    {statusLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        onDragStart={handleDragStart}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <>
          <div className="glass overflow-hidden flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Lead</th>
                    <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Country</th>
                    <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                    <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Temp</th>
                    <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Value</th>
                    <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Source</th>
                    <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Assigned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
                  ) : leads.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No leads found</td></tr>
                  ) : leads.map((lead) => (
                    <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} className="hover:bg-neon-cyan/5 transition-colors cursor-pointer group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-ink-950 font-bold text-xs">
                            {lead.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-neon-cyan transition-colors">{lead.name}</p>
                            <p className="text-[10px] font-mono text-slate-500">{lead.email || lead.phone || `#${lead.id}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">{lead.country || '—'}</td>
                      <td className="px-6 py-4"><span className={`tag tag--${lead.temperature?.toLowerCase() === 'hot' ? 'hot' : 'neutral'}`}>{lead.status}</span></td>
                      <td className="px-6 py-4"><span className={`tag tag--${lead.temperature?.toLowerCase() || 'neutral'}`}>{lead.temperature}</span></td>
                      <td className="px-6 py-4 text-right font-mono text-sm font-bold text-white">{lead.estimated_value ? `$${lead.estimated_value.toLocaleString()}` : '—'}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">{lead.source}</td>
                      <td className="px-6 py-4 text-xs text-slate-400">{lead.assigned_user_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-ink-900/60 border border-white/5 text-slate-400 disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-mono text-slate-400">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg bg-ink-900/60 border border-white/5 text-slate-400 disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {showCreate && <CreateLeadModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
