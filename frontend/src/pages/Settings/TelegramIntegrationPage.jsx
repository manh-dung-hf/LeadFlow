import React, { useState, useEffect } from 'react';
import {
  Send, Key, CheckCircle2, ArrowLeft, HelpCircle, Zap, Bot, MessageSquare, Loader2,
  Copy, ExternalLink, AlertTriangle, Shield, Globe, Terminal,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { integrationService } from '../../services/api';
import toast from 'react-hot-toast';

const STEPS = [
  {
    num: 1,
    title: 'Mở Telegram và tìm @BotFather',
    content: 'Mở ứng dụng Telegram, tìm kiếm @BotFather trong thanh search. Đây là bot chính thức của Telegram để tạo và quản lý bot.',
    tip: 'BotFather có dấu tick xanh xác minh. Đảm bảo bạn chọn đúng.',
  },
  {
    num: 2,
    title: 'Tạo bot mới với lệnh /newbot',
    content: 'Gửi lệnh /newbot cho BotFather. Bot sẽ hỏi bạn đặt tên hiển thị (ví dụ: "LeadFlow Sales Bot") và username (phải kết thúc bằng "bot", ví dụ: leadflow_sales_bot).',
    tip: 'Username phải unique trên toàn Telegram và kết thúc bằng "bot".',
  },
  {
    num: 3,
    title: 'Copy Bot Token',
    content: 'Sau khi tạo xong, BotFather sẽ gửi cho bạn một token dạng: 123456789:ABCdefGHIjklMNOpqrSTUVwxyz. Copy toàn bộ token này.',
    tip: 'Giữ token bí mật! Ai có token có thể điều khiển bot của bạn.',
  },
  {
    num: 4,
    title: 'Dán token vào form bên trên và Test',
    content: 'Paste token vào ô "Bot Token" ở trên, nhấn "Test Connection" để kiểm tra. Nếu thành công, bạn sẽ thấy tên bot hiển thị.',
    tip: 'Nếu test thất bại, kiểm tra lại token đã copy đầy đủ chưa.',
  },
  {
    num: 5,
    title: 'Thiết lập Webhook',
    content: 'Sau khi save, hệ thống sẽ tự động nhận tin nhắn từ bot. Mỗi tin nhắn khách gửi đến bot sẽ tự động tạo lead mới trong hệ thống và được AI phân tích.',
    tip: 'Bạn cần deploy backend lên server public (có HTTPS) để webhook hoạt động. Localhost không nhận được webhook từ Telegram.',
  },
  {
    num: 6,
    title: '(Tùy chọn) Lấy Chat ID để nhận thông báo',
    content: 'Để bot gửi thông báo ngược lại cho bạn (new lead, SLA alert...): Gửi /start cho bot của bạn, sau đó truy cập https://api.telegram.org/bot<TOKEN>/getUpdates để lấy chat_id. Điền vào ô "Notification Chat ID".',
    tip: 'Chat ID thường là một số dương (ví dụ: 123456789). Group chat ID là số âm.',
  },
];

export default function TelegramIntegrationPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [notifyChatId, setNotifyChatId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [openStep, setOpenStep] = useState(null);

  useEffect(() => {
    integrationService.getAll().then((res) => {
      const tg = res.data.find((i) => i.name === 'telegram');
      if (tg?.config) {
        setToken(tg.config.token || '');
        setNotifyChatId(tg.config.notify_chat_id || '');
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!token) { toast.error('Vui lòng nhập Bot Token'); return; }
    setIsSaving(true);
    try {
      await integrationService.update('telegram', {
        config: { token, notify_chat_id: notifyChatId },
        is_active: true,
      });
      toast.success('Đã lưu cấu hình Telegram!');
    } catch { toast.error('Lưu thất bại'); }
    finally { setIsSaving(false); }
  };

  const handleTest = async () => {
    if (!token) { toast.error('Nhập token trước khi test'); return; }
    setIsTesting(true); setTestResult(null);
    try {
      // Save first so backend can test
      await integrationService.update('telegram', {
        config: { token, notify_chat_id: notifyChatId },
        is_active: true,
      });
      const res = await integrationService.test('telegram');
      setTestResult({ success: true, message: res.data.message });
      toast.success(res.data.message);
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.message || 'Kết nối thất bại' });
      toast.error('Test kết nối thất bại');
    } finally { setIsTesting(false); }
  };

  const webhookUrl = `${window.location.origin}/api/integrations/webhook/telegram`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Back */}
      <button onClick={() => navigate('/settings')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-all font-medium text-sm">
        <ArrowLeft size={18} /> Quay lại Settings
      </button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#0088cc] to-[#29b6f6] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0088cc]/20">
          <Send size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display text-white">Telegram Bot</h1>
          <p className="text-slate-400 text-sm">Kết nối Telegram Bot để tự động nhận lead từ chat</p>
        </div>
      </div>

      {/* Config Form */}
      <div className="glass p-8 space-y-6">
        <div className="flex items-center gap-2 text-neon-cyan mb-2">
          <Key size={20} />
          <h3 className="font-bold text-lg">Cấu hình Bot</h3>
        </div>

        <div className="space-y-5">
          <div>
            <label className="label">Bot Token *</label>
            <p className="text-xs text-slate-500 mb-2">
              Lấy từ{' '}
              <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-neon-cyan font-bold hover:underline inline-flex items-center gap-1">
                @BotFather <ExternalLink size={10} />
              </a>
            </p>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNOpqrSTUVwxyz..."
              className="w-full px-5 py-3.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 focus:ring-4 focus:ring-neon-cyan/5 outline-none transition-all font-mono text-sm"
            />
          </div>

          <div>
            <label className="label">Notification Chat ID (tùy chọn)</label>
            <p className="text-xs text-slate-500 mb-2">ID chat để bot gửi thông báo (new lead, SLA alert...)</p>
            <input
              type="text"
              value={notifyChatId}
              onChange={(e) => setNotifyChatId(e.target.value)}
              placeholder="123456789"
              className="w-full px-5 py-3.5 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 outline-none transition-all font-mono text-sm"
            />
          </div>

          <div>
            <label className="label">Webhook URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-5 py-3.5 bg-ink-950/50 rounded-xl border border-white/5 font-mono text-xs text-slate-300 truncate">{webhookUrl}</code>
              <button onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('Đã copy'); }} className="p-3 bg-ink-900/60 border border-white/10 rounded-xl text-slate-400 hover:text-neon-cyan transition-all">
                <Copy size={16} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Đặt URL này làm webhook trong Telegram Bot API</p>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${testResult.success ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-neon-red/10 text-neon-red border border-neon-red/20'}`}>
            {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {testResult.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={handleTest} disabled={isTesting || !token} className="px-6 py-3 bg-ink-900/60 border border-white/10 text-slate-300 rounded-xl font-bold text-sm hover:bg-white/5 transition-all disabled:opacity-50 flex items-center gap-2">
            {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Terminal size={16} />}
            Test Connection
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-50">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Lưu & Kích hoạt
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="glass p-8">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-white">
          <Globe size={20} className="text-neon-cyan" /> Cách hoạt động
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Bot, title: 'Tạo Bot', desc: 'Tạo bot qua @BotFather trên Telegram', color: 'text-[#0088cc]' },
            { icon: Key, title: 'Nhập Token', desc: 'Paste token và test kết nối', color: 'text-neon-cyan' },
            { icon: MessageSquare, title: 'Nhận tin nhắn', desc: 'Khách nhắn tin → tự động tạo lead', color: 'text-neon-green' },
            { icon: Zap, title: 'AI phân tích', desc: 'AI phân loại, gợi ý reply tự động', color: 'text-neon-purple' },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center space-y-3 group">
              <div className="w-16 h-16 bg-ink-800/50 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-neon-cyan/30 transition-all">
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
          <HelpCircle size={20} className="text-neon-cyan" /> Hướng dẫn chi tiết từng bước
        </h3>
        <div className="space-y-1">
          {STEPS.map((step) => (
            <div key={step.num} className="border border-white/5 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenStep(openStep === step.num ? null : step.num)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-lg bg-neon-cyan/10 text-neon-cyan flex items-center justify-center font-mono text-sm font-bold border border-neon-cyan/20">
                    {step.num}
                  </span>
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

      {/* Security Note */}
      <div className="glass p-6 flex items-start gap-4">
        <Shield size={20} className="text-neon-amber shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-white text-sm mb-1">Bảo mật</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Bot Token được mã hóa và lưu trữ an toàn trên server. Không chia sẻ token với bất kỳ ai.
            Nếu nghi ngờ token bị lộ, hãy tạo token mới qua @BotFather bằng lệnh /revoke.
          </p>
        </div>
      </div>
    </div>
  );
}
