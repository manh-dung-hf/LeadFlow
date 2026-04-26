import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Key, CheckCircle2, Loader2, Copy, ExternalLink, AlertTriangle,
  Shield, Globe, HelpCircle, Terminal, MessageSquare, Zap, Settings,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { integrationService } from '../../services/api';
import toast from 'react-hot-toast';

const ZaloIcon = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="currentColor">
    <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm8.15 27.15c-.5.87-1.27 1.55-2.15 2.05-.88.5-1.87.8-2.95.8H16.5c-.55 0-1-.45-1-1v-1.5c0-.35.18-.67.48-.85l8.52-5.15H16.5c-.55 0-1-.45-1-1V23c0-.55.45-1 1-1h10.55c.88 0 1.72.28 2.42.8.7.52 1.18 1.25 1.38 2.1.2.85.1 1.72-.28 2.5l-3.07 5.25h3.55c.55 0 1 .45 1 1v.5z"/>
  </svg>
);

const STEPS = [
  {
    num: 1,
    title: 'Tạo Zalo Official Account (OA)',
    content: 'Truy cập oa.zalo.me và đăng nhập bằng tài khoản Zalo cá nhân. Nhấn "Tạo Official Account", chọn loại OA phù hợp (Doanh nghiệp, Cửa hàng, v.v.), điền thông tin và xác minh.',
    tip: 'OA cần được xác minh doanh nghiệp để sử dụng đầy đủ API. OA chưa xác minh bị giới hạn số lượng tin nhắn.',
  },
  {
    num: 2,
    title: 'Đăng ký Zalo Developer và tạo ứng dụng',
    content: 'Truy cập developers.zalo.me → Đăng nhập → Tạo ứng dụng mới. Chọn "Official Account API" làm sản phẩm. Liên kết ứng dụng với OA đã tạo ở bước 1.',
    tip: 'Mỗi ứng dụng chỉ liên kết được với 1 OA. Đảm bảo chọn đúng OA.',
  },
  {
    num: 3,
    title: 'Lấy OA ID, App ID và Secret Key',
    content: 'Trong trang quản lý ứng dụng: OA ID hiển thị trong phần "Official Account". App ID và Secret Key nằm trong phần "Thông tin ứng dụng". Copy cả 3 giá trị này.',
    tip: 'Secret Key chỉ hiển thị 1 lần khi tạo. Nếu mất, bạn phải tạo key mới.',
  },
  {
    num: 4,
    title: 'Cấu hình Webhook trong Zalo Developer',
    content: 'Trong phần "Webhook" của ứng dụng: Nhập Callback URL (webhook URL bên dưới). Chọn các sự kiện cần nhận: "Tin nhắn gửi đến OA", "Người dùng gửi hình ảnh", "Người dùng chia sẻ thông tin".',
    tip: 'Webhook URL phải là HTTPS và trả về status 200 trong vòng 5 giây. Zalo sẽ gửi request xác minh khi đăng ký.',
  },
  {
    num: 5,
    title: 'Nhập thông tin vào form và Test',
    content: 'Paste OA ID, App ID, Secret Key vào form bên trên. Nhấn "Test Connection". Sau đó thử nhắn tin đến OA từ tài khoản Zalo cá nhân để kiểm tra lead có được tạo không.',
    tip: 'Ở chế độ development, chỉ admin của OA mới nhắn tin được. Cần submit review để mở cho public.',
  },
  {
    num: 6,
    title: 'Submit Review để mở public',
    content: 'Trong Zalo Developer, vào phần "Xét duyệt" → Submit ứng dụng để review. Zalo sẽ kiểm tra và phê duyệt trong 1-3 ngày. Sau khi approved, mọi người dùng Zalo đều có thể nhắn tin đến OA.',
    tip: 'Chuẩn bị mô tả rõ ràng về mục đích sử dụng API và ảnh chụp màn hình demo.',
  },
];

export default function ZaloIntegrationPage() {
  const navigate = useNavigate();
  const [oaId, setOaId] = useState('');
  const [appId, setAppId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [openStep, setOpenStep] = useState(null);

  useEffect(() => {
    integrationService.getAll().then((res) => {
      const zalo = res.data.find((i) => i.name === 'zalo');
      if (zalo?.config) {
        setOaId(zalo.config.oa_id || '');
        setAppId(zalo.config.app_id || '');
        setSecretKey(zalo.config.secret_key || '');
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!oaId) { toast.error('Vui lòng nhập OA ID'); return; }
    setIsSaving(true);
    try {
      await integrationService.update('zalo', {
        config: { oa_id: oaId, app_id: appId, secret_key: secretKey },
        is_active: true,
      });
      toast.success('Đã lưu cấu hình Zalo!');
    } catch { toast.error('Lưu thất bại'); }
    finally { setIsSaving(false); }
  };

  const handleTest = async () => {
    if (!oaId) { toast.error('Nhập OA ID trước'); return; }
    setIsTesting(true); setTestResult(null);
    try {
      await integrationService.update('zalo', {
        config: { oa_id: oaId, app_id: appId, secret_key: secretKey },
        is_active: true,
      });
      const res = await integrationService.test('zalo');
      setTestResult({ success: res.data.status === 'success', message: res.data.message });
      toast.success(res.data.message);
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.message || 'Kết nối thất bại' });
      toast.error('Test thất bại');
    } finally { setIsTesting(false); }
  };

  const webhookUrl = `${window.location.origin}/api/integrations/webhook/zalo`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <button onClick={() => navigate('/settings')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-all font-medium text-sm">
        <ArrowLeft size={18} /> Quay lại Settings
      </button>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#0068FF] to-[#0045AA] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0068FF]/20">
          <ZaloIcon size={32} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display text-white">Zalo Official Account</h1>
          <p className="text-slate-400 text-sm">Kết nối Zalo OA để nhận lead từ thị trường Việt Nam</p>
        </div>
      </div>

      {/* Config Form */}
      <div className="glass p-8 space-y-6">
        <div className="flex items-center gap-2 text-neon-blue mb-2">
          <Key size={20} />
          <h3 className="font-bold text-lg">Cấu hình Zalo OA</h3>
        </div>

        <div className="space-y-5">
          <div>
            <label className="label">OA ID *</label>
            <p className="text-xs text-slate-500 mb-2">
              Lấy từ{' '}
              <a href="https://oa.zalo.me" target="_blank" rel="noreferrer" className="text-neon-blue font-bold hover:underline inline-flex items-center gap-1">
                oa.zalo.me <ExternalLink size={10} />
              </a>
            </p>
            <input type="text" value={oaId} onChange={(e) => setOaId(e.target.value)}
              placeholder="1234567890"
              className="w-full px-5 py-3.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-blue/50 focus:ring-4 focus:ring-neon-blue/5 outline-none transition-all font-mono text-sm" />
          </div>

          <div>
            <label className="label">App ID</label>
            <p className="text-xs text-slate-500 mb-2">
              Lấy từ{' '}
              <a href="https://developers.zalo.me" target="_blank" rel="noreferrer" className="text-neon-blue font-bold hover:underline inline-flex items-center gap-1">
                developers.zalo.me <ExternalLink size={10} />
              </a>
            </p>
            <input type="text" value={appId} onChange={(e) => setAppId(e.target.value)}
              placeholder="1234567890123456"
              className="w-full px-5 py-3.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-blue/50 outline-none transition-all font-mono text-sm" />
          </div>

          <div>
            <label className="label">Secret Key</label>
            <input type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-5 py-3.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-blue/50 outline-none transition-all font-mono text-sm" />
          </div>

          <div>
            <label className="label">Webhook URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-5 py-3.5 bg-ink-950/50 rounded-xl border border-white/5 font-mono text-xs text-slate-300 truncate">{webhookUrl}</code>
              <button onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('Đã copy'); }} className="p-3 bg-ink-900/60 border border-white/10 rounded-xl text-slate-400 hover:text-neon-blue transition-all">
                <Copy size={16} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Đặt URL này trong Zalo Developer → Webhook Configuration</p>
          </div>
        </div>

        {testResult && (
          <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${testResult.success ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-neon-red/10 text-neon-red border border-neon-red/20'}`}>
            {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {testResult.message}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={handleTest} disabled={isTesting || !oaId} className="px-6 py-3 bg-ink-900/60 border border-white/10 text-slate-300 rounded-xl font-bold text-sm hover:bg-white/5 transition-all disabled:opacity-50 flex items-center gap-2">
            {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Terminal size={16} />}
            Test Connection
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-50">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            Lưu & Kích hoạt
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="glass p-8">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white">
          <Globe size={20} className="text-neon-blue" /> Cách hoạt động
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Settings, title: 'Tạo OA', desc: 'Đăng ký Zalo Official Account tại oa.zalo.me', color: 'text-[#0068FF]' },
            { icon: Key, title: 'Nhập cấu hình', desc: 'Paste OA ID, App ID, Secret Key', color: 'text-neon-blue' },
            { icon: MessageSquare, title: 'Nhận tin nhắn', desc: 'Khách nhắn Zalo OA → tạo lead tự động', color: 'text-neon-cyan' },
            { icon: Zap, title: 'AI xử lý', desc: 'AI phân loại tiếng Việt, gợi ý reply', color: 'text-neon-purple' },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center space-y-3 group">
              <div className="w-16 h-16 bg-ink-800/50 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-neon-blue/30 transition-all">
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
          <HelpCircle size={20} className="text-neon-blue" /> Hướng dẫn chi tiết từng bước
        </h3>
        <div className="space-y-1">
          {STEPS.map((step) => (
            <div key={step.num} className="border border-white/5 rounded-xl overflow-hidden">
              <button onClick={() => setOpenStep(openStep === step.num ? null : step.num)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-lg bg-neon-blue/10 text-neon-blue flex items-center justify-center font-mono text-sm font-bold border border-neon-blue/20">{step.num}</span>
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
          <h4 className="font-bold text-white text-sm mb-1">Lưu ý quan trọng</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Zalo OA API yêu cầu xác minh doanh nghiệp. Ở chế độ development, chỉ admin OA mới tương tác được.
            Sau khi submit review và được phê duyệt, mọi người dùng Zalo đều có thể nhắn tin đến OA.
            Secret Key được lưu trữ mã hóa trên server.
          </p>
        </div>
      </div>
    </div>
  );
}
