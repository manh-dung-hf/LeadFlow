import { clsx } from 'clsx';

const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:5000';

const sizes = {
  xs: 'w-7 h-7 text-[9px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

export default function Avatar({ name, src, size = 'sm', className }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const fullSrc = src?.startsWith('http') ? src : src ? `${API_HOST}${src}` : null;

  if (fullSrc) {
    return (
      <img
        src={fullSrc}
        alt={name || ''}
        className={clsx(
          'rounded-xl object-cover border border-white/10',
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div className={clsx(
      'rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-ink-950 font-bold border border-white/10',
      sizes[size],
      className
    )}>
      {initials}
    </div>
  );
}
