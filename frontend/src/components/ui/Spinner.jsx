import { clsx } from 'clsx';

export default function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={clsx('border-2 border-neon-cyan border-t-transparent rounded-full animate-spin', sizes[size], className)} />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner />
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
