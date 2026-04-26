import { clsx } from 'clsx';

const colors = {
  online: 'bg-neon-green shadow-[0_0_8px_#34d399]',
  warning: 'bg-neon-amber shadow-[0_0_8px_#fbbf24]',
  danger: 'bg-neon-red shadow-[0_0_8px_#f87171]',
  offline: 'bg-slate-500',
};

export default function StatusDot({ status = 'online', pulse = false, size = 'w-2 h-2' }) {
  return (
    <span className={clsx(
      'rounded-full inline-block',
      size,
      colors[status] || colors.offline,
      pulse && 'animate-pulse'
    )} />
  );
}
