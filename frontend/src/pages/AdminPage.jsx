import { useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Trash2, UserX, UserCheck } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useDebounce, useFetch } from '../hooks/useFetch';
import { Chip, EmptyState, ErrorState, PageHeader, Skeleton, StatCard } from '../components/ui';

const act = async (fn, ok, reload) => { try { await fn(); toast.success(ok); reload(); } catch (e) { toast.error(getErrorMessage(e)); } };
const Pager = ({ pg, page, setPage }) => pg && (
  <div className="flex items-center justify-between pt-2 text-sm"><button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
    <span className="text-slate-500">Page {pg.page} of {pg.pages}</span><button className="btn-ghost" disabled={page >= pg.pages} onClick={() => setPage(page + 1)}>Next</button></div>);

function Overview() {
  const { data, loading, error, reload } = useFetch('/admin/statistics');
  if (loading) return <Skeleton className="h-40" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const s = data.statistics;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={s.totalUsers} /><StatCard label="Active users (30d)" value={s.activeUsers} />
        <StatCard label="Resumes" value={s.totalResumes} /><StatCard label="Mock interviews" value={s.totalInterviews} />
        <StatCard label="Questions" value={s.totalQuestions} /><StatCard label="Reported questions" value={s.reportedQuestions} />
        <StatCard label="Average score" value={s.averageScore != null ? `${s.averageScore}%` : '-'} />
      </div>
      <div className="card"><h3 className="mb-2 text-sm font-semibold">Question categories</h3>
        <div className="flex flex-wrap gap-1.5">{data.categories.map((c, i) => <Chip key={i}>{c.name} ({c.count}){c.domain ? ` - ${c.domain}` : ''}</Chip>)}</div></div>
    </div>
  );
}

function Users() {
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const q = useDebounce(search);
  const { data, loading, error, reload } = useFetch('/admin/users', { search: q || undefined, page });
  return (
    <div className="space-y-3">
      <input className="input max-w-sm" placeholder="Search name or email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      {loading ? <Skeleton className="h-40" /> : error ? <ErrorState message={error} onRetry={reload} /> : !data.items.length ? <EmptyState title="No users found" /> : (
        <div className="card overflow-x-auto p-0"><table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-neutral-800"><tr><th className="p-3">Name</th><th>Email</th><th>Domain</th><th>Role</th><th>Status</th><th /></tr></thead>
          <tbody>{data.items.map((u) => (
            <tr key={u._id} className="border-b border-slate-100 dark:border-neutral-800"><td className="p-3">{u.name}</td><td>{u.email}</td><td>{u.domain || '-'}</td>
              <td><Chip tone={u.role === 'admin' ? 'warn' : 'default'}>{u.role}</Chip></td><td>{u.isActive ? <Chip tone="good">Active</Chip> : <Chip tone="bad">Disabled</Chip>}</td>
              <td className="space-x-1 whitespace-nowrap p-2 text-right">
                <button className="btn-ghost" title={u.isActive ? 'Disable' : 'Enable'} onClick={() => act(() => api.patch(`/admin/users/${u._id}`, { isActive: !u.isActive }), 'User updated', reload)}>{u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}</button>
                <button className="btn-ghost text-red-500" title="Delete user and all data" onClick={() => window.confirm(`Delete ${u.email} and all their data?`) && act(() => api.delete(`/admin/users/${u._id}`), 'User deleted', reload)}><Trash2 size={15} /></button></td></tr>))}</tbody></table></div>)}
      <Pager pg={data?.pagination} page={page} setPage={setPage} />
    </div>
  );
}

function Questions() {
  const [reported, setReported] = useState(true); const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const q = useDebounce(search);
  const { data, loading, error, reload } = useFetch('/admin/questions', { reported: reported ? 'true' : undefined, search: q || undefined, page });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3"><input className="input max-w-sm" placeholder="Search questions" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={reported} onChange={(e) => { setReported(e.target.checked); setPage(1); }} /> Reported only</label></div>
      {loading ? <Skeleton className="h-40" /> : error ? <ErrorState message={error} onRetry={reload} /> : !data.items.length ? <EmptyState title="No questions found" /> : data.items.map((it) => (
        <div key={it._id} className="card flex items-start justify-between gap-3 py-3"><div className="text-sm"><p className="font-medium">{it.question}</p>
          <p className="text-xs text-slate-500">{it.category} - {it.difficulty} - {it.user?.email}</p>{it.reported && <p className="text-xs text-red-500">Reported: {it.reportReason}</p>}</div>
          <div className="flex shrink-0">{it.reported && <button className="btn-ghost" title="Dismiss report" onClick={() => act(() => api.patch(`/admin/questions/${it._id}/dismiss-report`), 'Report dismissed', reload)}><Check size={15} /></button>}
            <button className="btn-ghost text-red-500" title="Delete question" onClick={() => window.confirm('Delete this question?') && act(() => api.delete(`/admin/questions/${it._id}`), 'Question deleted', reload)}><Trash2 size={15} /></button></div></div>))}
      <Pager pg={data?.pagination} page={page} setPage={setPage} />
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState('overview');
  return (
    <div>
      <PageHeader title="Admin dashboard" subtitle="Platform statistics, users and content moderation." />
      <div className="mb-4 flex gap-2">{['overview', 'users', 'questions'].map((t) => (
        <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 text-sm capitalize ${tab === t ? 'bg-brand-600 text-white' : 'btn-ghost'}`}>{t}</button>))}</div>
      {tab === 'overview' ? <Overview /> : tab === 'users' ? <Users /> : <Questions />}
    </div>
  );
}
