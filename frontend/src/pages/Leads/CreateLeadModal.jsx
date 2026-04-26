import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService } from '../../services/api';
import toast from 'react-hot-toast';

const SOURCES = ['MANUAL', 'WEB', 'TELEGRAM', 'WHATSAPP', 'ZALO', 'ALIBABA', 'EMAIL'];

export default function CreateLeadModal({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '', phone: '', email: '', country: '', source: 'MANUAL', content: '', estimated_value: '',
  });

  const mutation = useMutation({
    mutationFn: (data) => leadService.createLead(data),
    onSuccess: () => {
      toast.success('Lead created! AI is processing...');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to create lead');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) {
      toast.error('Name is required');
      return;
    }
    mutation.mutate({
      ...form,
      estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : 0,
    });
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold font-display text-white">New Lead</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input value={form.name} onChange={set('name')} placeholder="Full name" className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 outline-none text-sm" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input value={form.phone} onChange={set('phone')} placeholder="+1 234 567 890" className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 outline-none text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input value={form.email} onChange={set('email')} type="email" placeholder="email@example.com" className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 outline-none text-sm" />
            </div>
            <div>
              <label className="label">Country</label>
              <input value={form.country} onChange={set('country')} placeholder="USA, Vietnam..." className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 outline-none text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Source</label>
              <select value={form.source} onChange={set('source')} className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 outline-none text-sm">
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Est. Value ($)</label>
              <input value={form.estimated_value} onChange={set('estimated_value')} type="number" placeholder="0" className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 outline-none text-sm" />
            </div>
          </div>

          <div>
            <label className="label">Message / Inquiry</label>
            <textarea value={form.content} onChange={set('content')} rows={3} placeholder="Lead's message or inquiry..." className="w-full px-4 py-2.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 outline-none text-sm resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-400 hover:text-white text-sm font-bold">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary disabled:opacity-50">
              {mutation.isPending ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
