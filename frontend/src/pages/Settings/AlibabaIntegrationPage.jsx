import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Key, CheckCircle2, Loader2, Copy, ExternalLink, AlertTriangle,
  Shield, Globe, HelpCircle, Terminal, MessageSquare, Zap, Settings, Package, ShoppingCart,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { integrationService } from '../../services/api';
import toast from 'react-hot-toast';

const STEPS = [
  {
    num: 1,
    title: 'Đăng nhập Alibaba Seller Account',
    content: 'Truy cập seller.alibaba.com và đăng nhập bằng tài khoản seller. Bạn cần có gói Gold Supplier hoặc Verified Supplier để sử dụng API.',
    tip: 'Nếu chưa có tài khoản seller, đăng ký tại alibaba.com/trade/seller.',
  },
  {
    num: 2,
    title: 'Truy cập Alibaba Open Platform',
    content: 'Vào open.alibaba.com → Đăng nhập → Tạo ứng dụng mới. Chọn loại "Trade" hoặc "Inquiry Management". Alibaba sẽ cấp App Key và App Secret.',
    tip: 'Ứng dụng cần được review và approve bởi Alibaba trước khi sử dụng production API.',
  },
  {
    num: 3,
    title: 'Cấu hình Webhook / Notification URL',
    content: 'Trong phần "Message Subscription" hoặc "Inquiry Notification": Nhập webhook URL (bên dưới) để nhận thông báo khi có inquiry mới. Alibaba sẽ gửi POST request mỗi khi có khách hàng gửi inquiry.',
    tip: 'Alibaba gửi webhook với signature để xác minh. Webhook Secret dùng để verify request.',
  },
  {
    num: 4,
    title: 'Thiết lập Webhook Secret',
    content: 'Tạo một chuỗi bí mật (webhook secret) và nhập vào cả Alibaba platform và form bên trên. Hệ thống sẽ dùng secret này để xác minh request đến từ Alibaba.',
    tip: 'Dùng chuỗi ngẫu nhiên dài ít nhất 32 ký tự. Không dùng password cá nhân.',
  },
  {
    num: 5,
    title: 'Test và Kích hoạt',
    content: 'Nhấn "Test Connection" để kiểm tra cấu hình. Sau đó thử gửi inquiry test từ trang sản phẩm Alibaba của bạn. Inquiry sẽ tự động tạo lead trong hệ thống.',
    tip: 'Có thể dùng tài khoản buyer khác để gửi inquiry test.',
  },
];

const PAYLOAD_EXAMPLE = `{
  "buyer_name": "John Smith",
  "email": "john@company.com",
  "country": "USA",
  "phone": "+1234567890",
  "message": "Interested in bamboo houses...",
  "inquiry": "Need quote for 10 units"
}`;

export default function AlibabaIntegrationPage() {
  const navigate = useNavigate();
  const [webhookSecret, setWebhookSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [openStep, setOpenStep] = useState(null);

  useEffect(() => {
    integrationService.getAll().then((res) => {
      const ali = res.data.find((i) => i.name === 'alibaba');
      if (ali?.config) {
        setWebhookSecret(ali.config.webhook_secret || '');
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await integrationService.update('alibaba', {
        config: { webhook_secret: webhookSecret },
        is_active: true,
      });
      toast.success('Đã lưu cấu hình Alibaba!');
    } catch { toast.error('Lưu thất bại'); }
    finally { setIsSaving(false); }
  };

  const handleTest = async () => {
    setIsTesting(true); setTestResult(null);
    try {
      await integrationService.update('alibaba', {
        config: { webhook_secret: webhookSecret },
        is_active: true,
      });
      const res = await integrationService.test('alibaba');
      setTestResult({ success: res.data.status === 'success', message: res.data.message });
      toast.success(res.data.message);
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.message || 'Thất bại' });
      toast.error('Test thất bại');
    } finally { setIsTesting(false); }
  };

  const webhookUrl = `${window.location.origin}/api/integrations/webhook/alibaba`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <button onClick={() => navigate('/settings')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-all font-medium text-sm">
        <ArrowLeft size={18} /> Quay lại Settings
      </button>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#FF6A00] to-[#E65100] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF6A00]/20">
          <ShoppingCart size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display text-white">Alibaba Integration</h1>
          <p className="text-slate-400 text-sm">Nhận inquiry từ Alibaba tự động qua webhook</p>
        </div>
      </div>

      {/* Config Form */}
      <div className="glass p-8 space-y-6">
        <div className="flex items-center gap-2 text-neon-amber mb-2">
          <Key size={20} />
          <h3 className="font-bold text-lg">Cấu hình Webhook</h3>
        </div>

        <div className="space-y-5">
          <div>
            <label className="label">Webhook Secret (tùy chọn)</label>
            <p className="text-xs text-slate-500 mb-2">Chuỗi bí mật để xác minh request từ Alibaba</p>
            <input type="password" value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder="your-webhook-secret-key..."
              className="w-full px-5 py-3.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-amber/50 focus:ring-4 focus:ring-neon-amber/5 outline-none transition-all font-mono text-sm" />
          </div>

          <div>
            <label className="label">Webhook URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-5 py-3.5 bg-ink-950/50 rounded-xl border border-white/5 font-mono text-xs text-slate-300 truncate">{webhookUrl}</code>
              <button onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('Đã copy'); }} className="p-3 bg-ink-900/60 border border-white/10 rounded-xl text-slate-400 hover:text-neon-amber transition-all">
                <Copy size={16} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Đặt URL này trong Alibaba Open Platform → Message Subscription</p>
          </div>

          <div>
            <label className="label">Payload mẫu (JSON)</label>
            <p className="text-xs text-slate-500 mb-2">Alibaba hoặc hệ thống bên thứ 3 gửi POST request với format sau:</p>
            <pre className="px-5 py-4 bg-ink-950/50 rounded-xl border border-white/5 font-mono text-xs text-slate-400 overflow-x-auto whitespace-pre">{PAYLOAD_EXAMPLE}</pre>
          </div>
        </div>

        {testResult && (
          <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${testResult.success ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-neon-red/10 text-neon-red border border-neon-red/20'}`}>
            {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {testResult.message}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={handleTest} disabled={isTesting} className="px-6 py-3 bg-ink-900/60 border border-white/10 text-slate-300 rounded-xl font-bold text-sm hover:bg-white/5 transition-all disabled:opacity-50 flex items-center gap-2">
            {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Terminal size={16} />}
            Test Connection
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-50">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
            Lưu & Kích hoạt
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="glass p-8">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white">
          <Globe size={20} className="text-neon-amber" /> Cách hoạt động
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: ShoppingCart, title: 'Buyer gửi inquiry', desc: 'Khách hàng gửi inquiry trên Alibaba', color: 'text-[#FF6A00]' },
            { icon: Zap, title: 'Webhook trigger', desc: 'Alibaba gửi POST đến webhook URL', color: 'text-neon-amber' },
            { icon: MessageSquare, title: 'Tạo lead tự động', desc: 'Hệ thống tạo lead với đầy đủ thông tin', color: 'text-neon-cyan' },
            { icon: Zap, title: 'AI phân tích', desc: 'AI phân loại, gợi ý sản phẩm & reply', color: 'text-neon-purple' },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center space-y-3 group">
              <div className="w-16 h-16 bg-ink-800/50 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-neon-amber/30 transition-all">
                <step.icon size={28} className={step.color} />
              </div>
              <p className="font-bold text-sm text-white">{step.title}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step-by-step Guide */}
      <div className="glass p-8">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white">
          <HelpCircle size={20} className="text-neon-amber" /> Hướng dẫn chi tiết từng bước
        </h3>
        <div className="space-y-1">
          {STEPS.map((step) => (
            <div key={step.num} className="border border-white/5 rounded-xl overflow-hidden">
              <button onClick={() => setOpenStep(openStep === step.num ? null : step.num)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-lg bg-neon-amber/10 text-neon-amber flex items-center justify-center font-mono text-sm font-bold border border-neon-amber/20">{step.num}</span>
                  <span className="font-bold text-sm text-white">{step.title}</span>
                </div>
                <span className={`text-slate-500 transition-transform ${openStep === step.num ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {openStep === step.num && (
                <div className="px-5 pb-5 pt-0 ml-12 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-sm text-slate-300 leading-relaxed">{step.content}</p>
                  <div className="flex items-start gap-2 p-3 bg-neon-amber/5 border border-neon-amber/20 rounded-lg">
                    <AlertTriangle size={14} className="text-neon-amber shrink-0 mt-0.5" />
                    <p className="text-xs text-neon-amber">{step.tip}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass p-6 flex items-start gap-4">
        <Shield size={20} className="text-neon-amber shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-white text-sm mb-1">Tích hợp linh hoạt</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Ngoài Alibaba chính thức, bạn có thể dùng webhook URL này với bất kỳ hệ thống nào gửi POST request
            với format JSON chứa các field: buyer_name, email, country, phone, message/inquiry.
            Phù hợp cho Zapier, Make.com, hoặc custom integration.
          </p>
        </div>
      </div>
    </div>
  );
}
