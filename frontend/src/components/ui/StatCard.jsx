import { useEffect, useRef, useState } from 'react';

const tones = {
  cyan: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20 group-hover:bg-neon-cyan group-hover:text-ink-950',
  green: 'bg-neon-green/10 text-neon-green border-neon-green/20 group-hover:bg-neon-green group-hover:text-ink-950',
  purple: 'bg-neon-purple/10 text-neon-purple border-neon-purple/20 group-hover:bg-neon-purple group-hover:text-ink-950',
  amber: 'bg-neon-amber/10 text-neon-amber border-neon-amber/20 group-hover:bg-neon-amber group-hover:text-ink-950',
  red: 'bg-neon-red/10 text-neon-red border-neon-red/20 group-hover:bg-neon-red group-hover:text-ink-950',
};

function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const num = typeof target === 'number' ? target : parseFloat(String(target).replace(/[^0-9.]/g, ''));
    if (isNaN(num)) { setValue(target); return; }

    let start = 0;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(start + (num - start) * eased));
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration]);

  // If target is not a pure number, return it as-is
  if (typeof target !== 'number') return target;
  return value;
}

export default function StatCard({ icon: Icon, label, value, delta, tone = 'cyan' }) {
  const displayValue = useCountUp(typeof value === 'number' ? value : 0);

  return (
    <div className="glass glass-hover p-5 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${tones[tone]}`}>
          <Icon size={20} />
        </div>
        {delta && (
          <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${
            delta.startsWith('+') || delta.startsWith('−') && delta.includes('-')
              ? 'text-neon-green bg-neon-green/10'
              : 'text-neon-red bg-neon-red/10'
          }`}>
            {delta}
          </span>
        )}
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1.5">{label}</p>
      <h3 className="text-3xl font-bold font-display text-white tracking-tight counter-animate">
        {typeof value === 'number' ? displayValue : value}
      </h3>

      {/* Decorative wave */}
      <div className="absolute bottom-0 left-0 right-0 h-10 opacity-[0.06] pointer-events-none overflow-hidden">
        <svg viewBox="0 0 100 20" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0,20 Q10,5 20,15 T40,10 T60,18 T80,8 T100,15 V20 H0 Z" fill="currentColor"
            className={tone === 'cyan' ? 'text-neon-cyan' : tone === 'green' ? 'text-neon-green' : tone === 'purple' ? 'text-neon-purple' : 'text-neon-amber'} />
        </svg>
      </div>
    </div>
  );
}
