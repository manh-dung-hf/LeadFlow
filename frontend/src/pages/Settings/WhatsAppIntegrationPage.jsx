import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Key, CheckCircle2, Loader2, Copy, ExternalLink, AlertTriangle,
  Shield, Globe, HelpCircle, Terminal, MessageSquare, Phone, Zap, Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { integrationService } from '../../services/api';
import toast from 'react-hot-toast';

const STEPS = [
  {
    num: 1,
    title: 'Tạo tài khoản Meta Business',
    content: 'Truy cập business.facebook.com và tạo tài khoản Business. Bạn cần xác minh doanh nghiệp để sử dụng WhatsApp Business API.',
    tip: 'Quá trình xác minh doanh nghiệp có thể mất 1-3 ngày làm việc.',
  },
  {
    num: 2,
    title: 'Tạo ứng dụng trên Meta for Developers',
    content: 'Truy cập developers.facebook.com → My Apps → Create App → chọn "Business" → thêm sản phẩm "WhatsApp". Meta sẽ cung cấp cho bạn một số điện thoại test và Access Token tạm thời.',
    tip: 'Access Token tạm thời hết hạn sau 24h. Để dùng lâu dài, tạo System User Token trong Business Settings.',
  },
  {
    num: 3,
    title: 'Lấy Permanent Access Token',
    content: 'Vào Business Settings → System Users → tạo System User → Generate Token với quyền "whatsapp_business_messaging" và "whatsapp_business_management". Copy token này.',
    tip: 'System User Token không hết hạn, phù hợp cho production.',
  },
  {
    num: 4,
    title: 'Lấy Phone Number ID',
    content: 'Trong WhatsApp Developer Dashboard, vào API Setup. Bạn sẽ thấy Phone Number ID (dạng số, ví dụ: 123456789012345). Copy ID này.',
    tip: 'Mỗi số điện thoại WhatsApp Business có một Phone Number ID riêng.',
  },
  {
    num: 5,
    title: 'Cấu hình Webhook',
    content: 'Trong WhatsApp Developer Dashboard → Configuration → Webhook: Nhập Callback URL (webhook URL bên dưới) và Verify Token (tùy chọn). Subscribe các field: "messages".',
    tip: 'Webhook URL phải là HTTPS public. Dùng ngrok để test local: ngrok http 5000',
  },
  {
    num: 6,
    title: 'Nhập thông tin vào form và Test',
    content: 'Paste Access Token, Phone Number ID, và API URL vào form bên trên. Nhấn "Test Connection" để kiểm tra. Sau đó gửi tin nhắn test từ số điện thoại đã đăng ký.',
    tip: 'Ở chế độ test, bạn chỉ gửi được đến 5 số điện thoại đã thêm vào whitelist.',
  },
];

export default function WhatsAppIntegrationPage() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [apiUrl, setApiUrl] = useState('https://graph.facebook.com/v18.0');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [openStep, setOpenStep] = useState(null);

  useEffect(() => {
    integrationService.getAll().then((res) => {
      const wa = res.data.find((i) => i.name === 'whatsapp');
      if (wa?.config) {
        setApiKey(wa.config.api_key || '');
        setPhoneNumberId(wa.config.phone_number_id || '');
        setApiUrl(wa.config.api_url || 'https://graph.facebook.com/v18.0');
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!apiKey) { toast.error('Vui lòng nhập Access Token'); return; }
    setIsSaving(true);
    try {
      await integrationService.update('whatsapp', {
        config: { api_key: apiKey, phone_number_id: phoneNumberId, api_url: apiUrl },
        is_active: true,
      });
      toast.success('Đã lưu cấu hình WhatsApp!');
    } catch { toast.error('Lưu thất bại'); }
    finally { setIsSaving(false); }
  };

  const handleTest = async () => {
    if (!apiKey) { toast.error('Nhập Access Token trước'); return; }
    setIsTesting(true); setTestResult(null);
    try {
      await integrationService.update('whatsapp', {
        config: { api_key: apiKey, phone_number_id: phoneNumberId, api_url: apiUrl },
        is_active: true,
      });
      const res = await integrationService.test('whatsapp');
      setTestResult({ success: res.data.status === 'success', message: res.data.message });
      toast.success(res.data.message);
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.message || 'Kết nối thất bại' });
      toast.error('Test thất bại');
    } finally { setIsTesting(false); }
  };

  const webhookUrl = `${window.location.origin}/api/integrations/webhook/whatsapp`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <button onClick={() => navigate('/settings')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-all font-medium text-sm">
        <ArrowLeft size={18} /> Quay lại Settings
      </button>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-2xl flex items-center justify-center shadow-lg shadow-[#25D366]/20">
          <Phone size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display text-white">WhatsApp Business API</h1>
          <p className="text-slate-400 text-sm">Kết nối WhatsApp Business API để nhận và trả lời lead</p>
        </div>
      </div>

      {/* Config Form */}
      <div className="glass p-8 space-y-6">
        <div className="flex items-center gap-2 text-neon-green mb-2">
          <Key size={20} />
          <h3 className="font-bold text-lg">Cấu hình API</h3>
        </div>

        <div className="space-y-5">
          <div>
            <label className="label">Access Token (Permanent) *</label>
            <p className="text-xs text-slate-500 mb-2">
              Lấy từ{' '}
              <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-neon-green font-bold hover:underline inline-flex items-center gap-1">
                Meta for Developers <ExternalLink size={10} />
              </a>
            </p>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              placeholder="EAAxxxxxxx..."
              className="w-full px-5 py-3.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-green/50 focus:ring-4 focus:ring-neon-green/5 outline-none transition-all font-mono text-sm" />
          </div>

          <div>
            <label className="label">Phone Number ID</label>
            <p className="text-xs text-slate-500 mb-2">ID số điện thoại WhatsApp Business của bạn</p>
            <input type="text" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="123456789012345"
              className="w-full px-5 py-3.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-green/50 outline-none transition-all font-mono text-sm" />
          </div>

          <div>
            <label className="label">API Base URL</label>
            <input type="text" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://graph.facebook.com/v18.0"
              className="w-full px-5 py-3.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-green/50 outline-none transition-all font-mono text-sm" />
          </div>

          <div>
            <label className="label">Webhook URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-5 py-3.5 bg-ink-950/50 rounded-xl border border-white/5 font-mono text-xs text-slate-300 truncate">{webhookUrl}</code>
              <button onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('Đã copy'); }} className="p-3 bg-ink-900/60 border border-white/10 rounded-xl text-slate-400 hover:text-neon-green transition-all">
                <Copy size={16} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Đặt URL này trong Meta Developer Dashboard → WhatsApp → Configuration → Webhook</p>
          </div>
        </div>

        {testResult && (
          <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${testResult.success ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-neon-red/10 text-neon-red border border-neon-red/20'}`}>
            {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {testResult.message}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={handleTest} disabled={isTesting || !apiKey} className="px-6 py-3 bg-ink-900/60 border border-white/10 text-slate-300 rounded-xl font-bold text-sm hover:bg-white/5 transition-all disabled:opacity-50 flex items-center gap-2">
            {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Terminal size={16} />}
            Test Connection
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-50">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />}
            Lưu & Kích hoạt
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="glass p-8">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white">
          <Globe size={20} className="text-neon-green" /> Cách hoạt động
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Settings, title: 'Tạo App', desc: 'Đăng ký Meta Business & tạo WhatsApp App', color: 'text-[#25D366]' },
            { icon: Key, title: 'Nhập Token', desc: 'Paste Access Token & Phone Number ID', color: 'text-neon-green' },
            { icon: MessageSquare, title: 'Nhận tin nhắn', desc: 'Khách nhắn WhatsApp → tạo lead tự động', color: 'text-neon-cyan' },
            { icon: Zap, title: 'AI xử lý', desc: 'AI phân loại, gợi ý reply, assign sales', color: 'text-neon-purple' },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center space-y-3 group">
              <div className="w-16 h-16 bg-ink-800/50 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-neon-green/30 transition-all">
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
          <HelpCircle size={20} className="text-neon-green" /> Hướng dẫn chi tiết từng bước
        </h3>
        <div className="space-y-1">
          {STEPS.map((step) => (
            <div key={step.num} className="border border-white/5 rounded-xl overflow-hidden">
              <button onClick={() => setOpenStep(openStep === step.num ? null : step.num)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-lg bg-neon-green/10 text-neon-green flex items-center justify-center font-mono text-sm font-bold border border-neon-green/20">{step.num}</span>
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
          <h4 className="font-bold text-white text-sm mb-1">Bảo mật & Lưu ý</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Access Token được lưu trữ mã hóa trên server. WhatsApp Business API yêu cầu xác minh doanh nghiệp.
            Ở chế độ test, chỉ gửi được đến các số đã thêm vào whitelist. Để gửi đến mọi số, cần hoàn tất Business Verification.
          </p>
        </div>
      </div>
    </div>
  );
}
