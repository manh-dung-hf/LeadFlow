import React, { useState } from 'react';
import {
  Globe, Send, MessageCircle, Zap, Check, Webhook, Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationService } from '../../services/api';
import toast from 'react-hot-toast';

const INTEGRATIONS_UI = {
  telegram: {
    icon: Send, name: 'Telegram Bot',
    description: 'Nhận và trả lời lead qua Telegram Bot.',
    iconClass: 'bg-sky-500/15 text-sky-400 border border-sky-500/25',
  },
  whatsapp: {
    icon: MessageCircle, name: 'WhatsApp API',
    description: 'Tích hợp WhatsApp Business API chính thức.',
    iconClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  },
  zalo: {
    icon: Zap, name: 'Zalo Official Account',
    description: 'Nhận lead từ thị trường Việt Nam qua Zalo OA.',
    iconClass: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  },
  alibaba: {
    icon: Webhook, name: 'Alibaba',
    description: 'Nhận inquiry từ Alibaba qua webhook.',
    iconClass: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  },
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [testing, setTesting] = useState(null);

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationService.getAll().then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ name, is_active, config }) => integrationService.update(name, { is_active, config }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Đã cập nhật');
    },
  });

  const handleTest = async (name) => {
    setTesting(name);
    try {
      const res = await integrationService.test(name);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test thất bại');
    } finally {
      setTesting(null);
    }
  };

  const handleToggle = (integration) => {
    toggleMutation.mutate({
      name: integration.name,
      is_active: !integration.is_active,
      config: integration.config,
    });
  };

  return (
    <div className="max-w-4xl space-y-12 pb-10">
      <div>
        <h1 className="text-3xl font-bold font-display text-white tracking-tight">System Settings</h1>
        <p className="text-slate-400 text-sm mt-1.5">Cấu hình kênh tích hợp và webhook.</p>
      </div>

      {/* Integrations */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Globe className="text-neon-cyan" size={24} />
          <h2 className="text-xl font-bold font-display text-white">Multi-Channel Integrations</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (integrations || []).length === 0 ? (
          <div className="glass p-8 text-center text-slate-500">Chưa có integration nào. Chạy seed.py để tạo dữ liệu mẫu.</div>
        ) : (
          <div className="space-y-4">
            {(integrations || []).map((integration) => {
              const ui = INTEGRATIONS_UI[integration.name] || {
                icon: Webhook, name: integration.name, description: '',
                iconClass: 'bg-slate-500/15 text-slate-400 border border-slate-500/25',
              };
              const Icon = ui.icon;

              return (
                <div key={integration.id} className="glass p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-2xl ${ui.iconClass}`}>
                      <Icon size={24} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-base">{ui.name}</h3>
                      <p className="text-sm text-slate-400 truncate">{ui.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Status badge */}
                    {integration.is_active ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        <Check size={10} /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-white/5 text-slate-500 border border-white/10">
                        Inactive
                      </span>
                    )}

                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(integration)}
                      className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${integration.is_active ? 'bg-emerald-500' : 'bg-ink-600'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${integration.is_active ? 'right-1' : 'left-1'}`} />
                    </button>

                    {/* Test */}
                    <button
                      onClick={() => handleTest(integration.name)}
                      disabled={testing === integration.name}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 text-slate-300 rounded-lg text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {testing === integration.name ? <Loader2 size={12} className="animate-spin" /> : 'Test'}
                    </button>

                    {/* Configure */}
                    <button
                      onClick={() => navigate(`/settings/${integration.name}`)}
                      className="px-4 py-1.5 bg-neon-cyan/10 border border-neon-cyan/25 text-neon-cyan rounded-lg text-xs font-bold hover:bg-neon-cyan/20 transition-all cursor-pointer"
                    >
                      Configure →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Webhook Endpoints */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Webhook className="text-neon-purple" size={24} />
          <h2 className="text-xl font-bold font-display text-white">Webhook Endpoints</h2>
        </div>
        <div className="glass p-6 space-y-4">
          <p className="text-sm text-slate-400">Sử dụng các endpoint này để nhận lead từ hệ thống bên ngoài:</p>
          {['telegram', 'whatsapp', 'zalo', 'alibaba', 'web'].map((name) => (
            <div key={name} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/8">
              <span className="text-xs font-bold text-neon-cyan uppercase w-24">{name}</span>
              <code className="text-xs font-mono text-slate-300 flex-1">
                POST /api/integrations/webhook/{name}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/integrations/webhook/${name}`);
                  toast.success('Đã copy');
                }}
                className="text-[10px] font-bold text-neon-cyan hover:underline cursor-pointer"
              >
                Copy
              </button>
            </div>
          ))}
          <div className="flex items-center gap-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/15">
            <span className="text-xs font-bold text-emerald-400 uppercase w-24">Public</span>
            <code className="text-xs font-mono text-slate-300 flex-1">
              POST /api/integrations/public/lead
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/api/integrations/public/lead`);
                toast.success('Đã copy');
              }}
              className="text-[10px] font-bold text-neon-cyan hover:underline cursor-pointer"
            >
              Copy
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
