import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui';

export default function NotificationsPage() {
  const { data, loading, error, reload } = useFetch('/notifications');
  const markAll = async () => { await api.patch('/notifications/read-all'); reload(); };
  const markOne = async (id) => { await api.patch(`/notifications/${id}/read`); reload(); };
  if (loading) return <Skeleton className="h-40" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <PageHeader title="Notifications"><button className="btn-ghost" onClick={markAll}><CheckCheck size={16} /> Mark all read</button></PageHeader>
      {!data.notifications.length ? <EmptyState title="Nothing here yet" /> : data.notifications.map((n) => (
        <div key={n._id} className={`card flex items-start gap-3 py-3 ${n.read ? 'opacity-60' : ''}`}>
          <Bell size={18} className="mt-0.5 text-brand-600" />
          <div className="flex-1"><p className="text-sm font-medium">{n.title}</p><p className="text-sm text-slate-500">{n.message}</p>
            <p className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p></div>
          {n.link && <Link className="text-sm text-brand-600" to={n.link} onClick={() => !n.read && markOne(n._id)}>Open</Link>}
          {!n.read && <button className="text-xs text-slate-500 hover:underline" onClick={() => markOne(n._id)}>Mark read</button>}
        </div>))}
    </div>
  );
}
