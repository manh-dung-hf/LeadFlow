import React, { useState } from 'react';
import {
  Plus, Copy, Sparkles, Search, X, RefreshCcw,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scriptService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function SalesScriptsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newScript, setNewScript] = useState({ title: '', content: '', category: 'greeting' });

  const { data: scripts, isLoading } = useQuery({
    queryKey: ['scripts'],
    queryFn: () => scriptService.getScripts().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => scriptService.createScript(data),
    onSuccess: () => {
      toast.success('Script created');
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
      setShowCreate(false);
      setNewScript({ title: '', content: '', category: 'greeting' });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => scriptService.deleteScript(id),
    onSuccess: () => {
      toast.success('Script deleted');
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
    },
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const filtered = (scripts || []).filter((s) =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.content.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(filtered.map((s) => s.category))];
  const canEdit = user?.role !== 'SALES';

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight">Sales Scripts</h1>
          <p className="text-slate-400 text-sm mt-1.5">{scripts?.length || 0} scripts</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} /> New Script
          </button>
        )}
      </div>

      <div className="glass p-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scripts..."
            className="w-full pl-11 pr-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/5 focus:border-neon-cyan/50 focus:ring-4 focus:ring-neon-cyan/5 outline-none transition-all text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-slate-500">No scripts yet</div>
      ) : (
        categories.map((cat) => (
          <div key={cat} className="space-y-5">
            <div className="flex items-center gap-4">
              <h3 className="font-display font-bold text-white text-lg uppercase tracking-wider">{cat}</h3>
              <div className="h-px flex-1 bg-white/5" />
              <span className="font-mono text-[10px] text-slate-500 uppercase">
                {filtered.filter((s) => s.category === cat).length} scripts
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.filter((s) => s.category === cat).map((script) => (
                <div key={script.id} className="glass glass-hover p-6 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => copyToClipboard(script.content)}
                      className="p-2 bg-neon-cyan/10 text-neon-cyan rounded-lg border border-neon-cyan/20 hover:bg-neon-cyan hover:text-ink-950 transition-all"
                    >
                      <Copy size={14} />
                    </button>
                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={() => deleteMutation.mutate(script.id)}
                        className="p-2 bg-neon-red/10 text-neon-red rounded-lg border border-neon-red/20 hover:bg-neon-red hover:text-white transition-all"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <h4 className="font-bold text-white mb-3 group-hover:text-neon-cyan transition-colors">{script.title}</h4>
                  <div className="p-4 bg-ink-950/50 rounded-xl border border-white/5 font-mono text-xs text-slate-400 leading-relaxed min-h-[80px] mb-4 group-hover:border-neon-cyan/20 transition-colors">
                    {script.content}
                  </div>
                  <span className="tag tag--purple">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="glass w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-display text-white">New Script</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(newScript); }} className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input value={newScript.title} onChange={(e) => setNewScript((f) => ({ ...f, title: e.target.value }))} className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm" />
              </div>
              <div>
                <label className="label">Category</label>
                <select value={newScript.category} onChange={(e) => setNewScript((f) => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm">
                  {['greeting', 'qualification', 'quote', 'objection', 'closing', 'follow_up'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Script Content</label>
                <textarea value={newScript.content} onChange={(e) => setNewScript((f) => ({ ...f, content: e.target.value }))} rows={5} placeholder="Use {{name}}, {{product}}, etc. for variables" className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 outline-none text-sm resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 text-slate-400 text-sm font-bold">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary disabled:opacity-50">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
