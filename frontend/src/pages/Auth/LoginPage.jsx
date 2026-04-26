import React, { useState } from 'react';
import { Zap, Mail, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-neon-cyan/10 blur-[140px]" />
        <div className="absolute top-40 -right-40 w-[600px] h-[600px] rounded-full bg-neon-purple/10 blur-[140px]" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-2xl flex items-center justify-center shadow-xl shadow-neon-cyan/20 mx-auto mb-6">
            <Zap className="text-ink-950 fill-ink-950" size={32} />
          </div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-white">
            LeadFlow <span className="text-neon-cyan">AI</span>
          </h1>
          <p className="text-slate-400 mt-3 font-medium">Intelligent Sales & CRM Platform</p>
        </div>

        <div className="glass p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@leadflow.ai"
                  className="w-full pl-12 pr-4 py-3 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 focus:ring-4 focus:ring-neon-cyan/5 outline-none transition-all text-sm"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-ink-950/50 rounded-xl border border-white/10 focus:border-neon-cyan/50 focus:ring-4 focus:ring-neon-cyan/5 outline-none transition-all text-sm"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 text-lg font-bold flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500 font-mono">
              Demo: admin@leadflow.ai / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
