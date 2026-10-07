import { AlertCircle, Inbox, Loader2, X } from 'lucide-react';

export const Spinner = ({ label }) => (
  <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} />{label}</div>
);
export const Skeleton = ({ className = 'h-24' }) => <div className={`card animate-pulse ${className}`} />;
export const EmptyState = ({ title, text, action }) => (
  <div className="card flex flex-col items-center gap-2 py-10 text-center">
    <Inbox className="text-slate-400" size={28} /><p className="font-medium">{title}</p>
    {text && <p className="max-w-md text-sm text-slate-500">{text}</p>}{action}
  </div>
);
export const ErrorState = ({ message, onRetry }) => (
  <div className="card flex flex-col items-center gap-2 py-8 text-center">
    <AlertCircle className="text-red-500" size={26} /><p className="text-sm text-red-500">{message}</p>
    {onRetry && <button className="btn-ghost" onClick={onRetry}>Retry</button>}
  </div>
);
export const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
    <div><h1 className="text-2xl font-semibold">{title}</h1>{subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}</div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);
export const ProgressBar = ({ value = 0 }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-neutral-900">
    <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);
export const StatCard = ({ label, value, hint }) => (
  <div className="card"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-semibold">{value ?? '-'}</p>{hint && <p className="text-xs text-slate-500">{hint}</p>}</div>
);
export const Chip = ({ children, tone = 'default' }) => {
  const tones = { default: 'bg-slate-100 text-slate-700 dark:bg-neutral-900 dark:text-neutral-200', good: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    bad: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300', warn: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
};
export const ChipList = ({ items = [], tone }) => (
  items.length ? <div className="flex flex-wrap gap-1.5">{items.map((i) => <Chip key={i} tone={tone}>{i}</Chip>)}</div> : <p className="text-sm text-slate-500">None</p>
);
export const difficultyTone = { easy: 'good', medium: 'warn', hard: 'bad' };
export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-3xl overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{title}</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Close"><X size={18} /></button></div>{children}
      </div>
    </div>
  );
}
export const Section = ({ title, children }) => (<div><h3 className="mb-2 text-sm font-semibold">{title}</h3>{children}</div>);
