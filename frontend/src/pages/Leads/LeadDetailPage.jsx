import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Send, Bot, MessageSquare, Phone, Mail, Clock, Sparkles, Globe, Zap, User,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadService, messageService, analyticsService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'WHATSAPP_MOVED', 'QUOTED', 'NEGOTIATION', 'WON', 'LOST'];

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on } = useSocket(user?.id);
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');
  const chatEndRef = useRef(null);

  // Fetch lead — refetch every 3s while AI is processing
  const { data: lead, isLoading } = useQuery({
    queryKey: ['leads', id],
    queryFn: () => leadService.getLead(id).then((r) => r.data),
    refetchInterval: (query) => {
      const data = query.state.data;
      // Keep polling if AI hasn't processed yet
      if (data && !data.ai_summary && data.content) return 3000;
      return false;
    },
  });

  // Fetch messages — auto-refetch every 5s for real-time feel
  const { data: messagesData } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => messageService.getMessages(id).then((r) => r.data),
    enabled: !!id,
    refetchInterval: 5000,
  });

  // Fetch sales users for assignment
  const { data: salesUsers } = useQuery({
    queryKey: ['salesUsers'],
    queryFn: () => leadService.getSalesUsers().then((r) => r.data),
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (content) => messageService.sendMessage({ lead_id: parseInt(id), content, channel: 'MANUAL' }),
    onSuccess: () => {
      setReply('');
      queryClient.invalidateQueries({ queryKey: ['messages', id] });
      queryClient.invalidateQueries({ queryKey: ['leads', id] });
    },
    onError: () => toast.error('Failed to send message'),
  });

  // Update lead mutation
  const updateMutation = useMutation({
    mutationFn: (data) => leadService.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', id] });
      toast.success('Lead updated');
    },
  });

  // AI follow-up suggestion
  const followUpMutation = useMutation({
    mutationFn: () => leadService.getFollowUpSuggestion(id),
    onSuccess: (res) => {
      setReply(res.data.follow_up_message || '');
      toast.success('AI suggestion loaded');
    },
    onError: () => toast.error('AI service unavailable'),
  });

  // Listen for real-time messages + lead updates
  useEffect(() => {
    const unsub1 = on('new_message', (data) => {
      if (data.lead_id === parseInt(id)) {
        queryClient.invalidateQueries({ queryKey: ['messages', id] });
        queryClient.invalidateQueries({ queryKey: ['leads', id] });
      }
    });
    const unsub2 = on('lead_updated', (data) => {
      if (data.id === parseInt(id)) {
        queryClient.invalidateQueries({ queryKey: ['leads', id] });
        queryClient.invalidateQueries({ queryKey: ['messages', id] });
      }
    });
    const unsub3 = on('lead_created', () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [id, on, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]);

  const handleSend = () => {
    if (!reply.trim()) return;
    sendMutation.mutate(reply.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const useSuggestedReply = () => {
    if (lead?.ai_suggested_reply) {
      setReply(lead.ai_suggested_reply);
      toast.success('AI reply loaded');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!lead) {
    return <div className="text-center py-20 text-slate-500">Lead not found</div>;
  }

  const messages = messagesData?.messages || [];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
        <button onClick={() => navigate('/leads')} className="hover:text-neon-cyan transition-colors flex items-center gap-1">
          <ArrowLeft size={12} /> LEADS
        </button>
        <span>/</span>
        <span className="text-slate-300">#{lead.id}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-ink-950 font-bold text-xl shadow-lg shadow-neon-cyan/20">
            {lead.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold font-display text-white tracking-tight">{lead.name}</h1>
              <span className={`tag tag--${lead.temperature?.toLowerCase() || 'neutral'}`}>{lead.temperature}</span>
            </div>
            <p className="text-sm text-slate-400">
              {lead.country || 'Unknown'} · {lead.source} · {lead.email || lead.phone || '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={lead.status}
            onChange={(e) => updateMutation.mutate({ status: e.target.value })}
            className="px-3 py-2 bg-ink-900/60 border border-white/10 text-slate-300 rounded-xl text-xs font-bold"
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={lead.assigned_to || ''}
            onChange={(e) => updateMutation.mutate({ assigned_to: parseInt(e.target.value) || null })}
            className="px-3 py-2 bg-ink-900/60 border border-white/10 text-slate-300 rounded-xl text-xs font-bold"
          >
            <option value="">Unassigned</option>
            {(salesUsers || []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation */}
        <div className="lg:col-span-2 glass flex flex-col h-[600px]">
          <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 text-neon-cyan flex items-center justify-center border border-neon-cyan/20">
                <MessageSquare size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-wider">Conversation</p>
                <p className="text-[10px] font-mono text-slate-500">{messages.length} messages</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {/* Initial lead message */}
            {lead.content && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple shrink-0 flex items-center justify-center text-ink-950 font-bold text-[10px]">
                  {lead.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="p-4 rounded-2xl text-sm leading-relaxed bg-ink-700/50 border border-white/5 text-slate-200 rounded-tl-sm">
                    {lead.content}
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">
                    {lead.created_at ? new Date(lead.created_at).toLocaleString() : ''} · via {lead.source}
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={clsx("flex gap-3 max-w-[85%]", msg.sender_type !== 'lead' && "ml-auto flex-row-reverse")}>
                {msg.sender_type === 'lead' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple shrink-0 flex items-center justify-center text-ink-950 font-bold text-[10px]">
                    {lead.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                )}
                <div className={msg.sender_type !== 'lead' ? "text-right" : ""}>
                  <div className={clsx(
                    "p-4 rounded-2xl text-sm leading-relaxed",
                    msg.sender_type === 'lead'
                      ? "bg-ink-700/50 border border-white/5 text-slate-200 rounded-tl-sm"
                      : msg.sender_type === 'ai'
                        ? "bg-neon-purple/10 border border-neon-purple/30 text-white rounded-tr-sm"
                        : "bg-gradient-to-br from-neon-cyan/20 to-neon-blue/20 border border-neon-cyan/30 text-white rounded-tr-sm"
                  )}>
                    {msg.content}
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''} · {msg.sender_type}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Reply box */}
          <div className="p-5 border-t border-white/5 bg-white/[0.02]">
            <div className="flex items-end gap-3">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a reply..."
                className="flex-1 bg-ink-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-neon-cyan/50 focus:ring-4 focus:ring-neon-cyan/5 outline-none transition-all resize-none h-12"
              />
              <button
                onClick={() => followUpMutation.mutate()}
                disabled={followUpMutation.isPending}
                className="p-3 bg-ink-900/60 border border-white/5 text-neon-purple hover:bg-neon-purple/10 rounded-xl transition-all"
                title="AI Suggest"
              >
                <Sparkles size={18} />
              </button>
              <button onClick={handleSend} disabled={sendMutation.isPending || !reply.trim()} className="btn-primary h-12 px-6 disabled:opacity-50">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Intelligence Panel */}
        <div className="space-y-6">
          {/* AI Processing Status */}
          <AiStatusPanel lead={lead} onUseSuggestion={useSuggestedReply} />

          {/* Lead Info */}
          <div className="glass p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Details</h3>
            <div className="space-y-3 text-sm">
              {lead.phone && (
                <div className="flex items-center gap-3 text-slate-400">
                  <Phone size={14} className="text-neon-cyan" /> {lead.phone}
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-3 text-slate-400">
                  <Mail size={14} className="text-neon-cyan" /> {lead.email}
                </div>
              )}
              {lead.country && (
                <div className="flex items-center gap-3 text-slate-400">
                  <Globe size={14} className="text-neon-cyan" /> {lead.country}
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-400">
                <Clock size={14} className="text-neon-cyan" />
                Created: {lead.created_at ? new Date(lead.created_at).toLocaleString() : '—'}
              </div>
              {lead.estimated_value > 0 && (
                <div className="flex items-center gap-3 text-slate-400">
                  <Zap size={14} className="text-neon-cyan" />
                  Value: ${lead.estimated_value.toLocaleString()}
                </div>
              )}
              {lead.assigned_user_name && (
                <div className="flex items-center gap-3 text-slate-400">
                  <User size={14} className="text-neon-cyan" />
                  Assigned: {lead.assigned_user_name}
                </div>
              )}
              {lead.sla_violated && (
                <div className="p-2 bg-neon-red/10 border border-neon-red/20 rounded-lg text-neon-red text-xs font-bold">
                  ⚠️ SLA Violated — Response time: {lead.response_time_seconds ? `${Math.floor(lead.response_time_seconds / 60)}m` : 'N/A'}
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <LeadTimeline leadId={id} />
        </div>
      </div>
    </div>
  );
}

function LeadTimeline({ leadId }) {
  const { data: activities } = useQuery({
    queryKey: ['lead-activity', leadId],
    queryFn: () => analyticsService.getLeadActivity(leadId).then((r) => r.data),
    enabled: !!leadId,
  });

  if (!activities || activities.length === 0) return null;

  return (
    <div className="glass p-5">
      <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Timeline</h3>
      <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/10">
        {activities.slice(0, 10).map((a) => (
          <div key={a.id} className="flex gap-3 relative">
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-ink-950 border border-white/10 z-10 shrink-0 text-[10px]">
              {a.action === 'lead_created' ? '➕' :
               a.action === 'lead_updated' ? '✏️' :
               a.action === 'message_sent' ? '💬' :
               a.action === 'ai_processed' ? '🤖' :
               a.action === 'lead_assigned' ? '👤' : '📌'}
            </div>
            <div>
              <p className="text-[12px] text-slate-300 leading-snug">
                <span className="font-bold text-white">{a.user_name || 'System'}</span>
                {' '}{a.action.replace(/_/g, ' ')}
              </p>
              <p className="text-[10px] font-mono text-slate-600 mt-0.5">
                {a.created_at ? new Date(a.created_at).toLocaleString('vi-VN') : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const AI_STEPS = [
  { key: 'language', label: 'Phát hiện ngôn ngữ', icon: '🌐' },
  { key: 'intent', label: 'Phân loại ý định', icon: '🎯' },
  { key: 'temperature', label: 'Đánh giá mức độ quan tâm', icon: '🌡️', checkValue: (v) => v && v !== 'WARM' },
  { key: 'urgency', label: 'Đánh giá mức độ khẩn cấp', icon: '⚡' },
  { key: 'budget', label: 'Trích xuất ngân sách', icon: '💰' },
  { key: 'product_interest', label: 'Nhận diện sản phẩm', icon: '📦' },
  { key: 'ai_summary', label: 'Tạo tóm tắt', icon: '📝' },
  { key: 'ai_suggested_reply', label: 'Tạo câu trả lời gợi ý', icon: '💬' },
  { key: 'ai_next_action', label: 'Đề xuất hành động tiếp', icon: '🚀' },
];

function AiStatusPanel({ lead, onUseSuggestion }) {
  const queryClient = useQueryClient();
  const isProcessed = !!lead.ai_summary;
  const completedSteps = AI_STEPS.filter((s) => {
    if (s.checkValue) return s.checkValue(lead[s.key]);
    return !!lead[s.key] && lead[s.key] !== 'Unknown' && lead[s.key] !== 'None';
  });
  const progress = Math.round((completedSteps.length / AI_STEPS.length) * 100);
  const isProcessing = !isProcessed && lead.content;

  // Auto-refresh while processing
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['leads', String(lead.id)] });
      queryClient.invalidateQueries({ queryKey: ['messages', String(lead.id)] });
    }, 3000);
    return () => clearInterval(interval);
  }, [isProcessing, lead.id, queryClient]);

  return (
    <>
      {/* Progress Bar */}
      <div className="glass p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="ai-badge">AI</span>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Analysis</h3>
          </div>
          <span className={`font-mono text-xs font-bold ${isProcessed ? 'text-neon-green' : 'text-neon-amber'}`}>
            {progress}%
          </span>
        </div>

        {/* Animated progress bar */}
        <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out relative"
            style={{
              width: `${progress}%`,
              background: isProcessed
                ? 'linear-gradient(90deg, #34d399, #22d3ee)'
                : 'linear-gradient(90deg, #22d3ee, #a855f7)',
            }}
          >
            {isProcessing && (
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shimmer 1.5s ease-in-out infinite',
                }}
              />
            )}
          </div>
        </div>

        {/* Step list */}
        <div className="space-y-2">
          {AI_STEPS.map((step, i) => {
            const done = step.checkValue
              ? step.checkValue(lead[step.key])
              : !!lead[step.key] && lead[step.key] !== 'Unknown' && lead[step.key] !== 'None';
            const isCurrentStep = !done && completedSteps.length === i;

            return (
              <div key={step.key} className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300',
                done ? 'bg-neon-green/5' : isCurrentStep ? 'bg-neon-cyan/5 border border-neon-cyan/20' : 'opacity-40'
              )}>
                <span className="text-sm w-6 text-center">{step.icon}</span>
                <span className={clsx('text-xs flex-1', done ? 'text-white' : 'text-slate-500')}>
                  {step.label}
                </span>
                {done ? (
                  <span className="text-neon-green text-xs font-bold">✓</span>
                ) : isCurrentStep && isProcessing ? (
                  <div className="w-4 h-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-slate-600 text-xs">—</span>
                )}
                {done && lead[step.key] && step.key !== 'ai_summary' && step.key !== 'ai_suggested_reply' && step.key !== 'ai_next_action' && (
                  <span className="text-[10px] font-mono text-slate-400 max-w-[100px] truncate">
                    {String(lead[step.key]).slice(0, 20)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {isProcessing && (
          <div className="mt-4 flex items-center gap-2 text-xs text-neon-cyan">
            <div className="w-3 h-3 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
            AI đang phân tích... (~20-30 giây)
          </div>
        )}
      </div>

      {/* Results (shown after processing) */}
      {lead.ai_summary && (
        <div className="glass p-5">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">AI Summary</p>
          <p className="text-sm text-slate-200 leading-relaxed">{lead.ai_summary}</p>
        </div>
      )}

      {lead.ai_suggested_reply && (
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Suggested Reply</h3>
            <button onClick={onUseSuggestion} className="text-[10px] font-bold text-neon-cyan hover:underline cursor-pointer">Use</button>
          </div>
          <div className="p-3 bg-ink-950/50 rounded-xl border border-neon-purple/20 text-xs text-slate-300 leading-relaxed">
            {lead.ai_suggested_reply}
          </div>
        </div>
      )}

      {lead.ai_next_action && (
        <div className="glass p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-3">Next Action</h3>
          <div className="p-3 bg-neon-cyan/5 rounded-xl border border-neon-cyan/20 text-xs text-neon-cyan font-bold">
            {lead.ai_next_action}
          </div>
        </div>
      )}
    </>
  );
}
