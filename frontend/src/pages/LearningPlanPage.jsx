import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { EmptyState, ErrorState, PageHeader, ProgressBar, Skeleton } from '../components/ui';

export default function LearningPlanPage() {
  const plans = useFetch('/learning-plans');
  const resumes = useFetch('/resumes');
  const resume = resumes.data?.resumes?.find((r) => r.status === 'analyzed');
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState({}); // id -> updated plan

  const generate = async () => {
    setBusy(true);
    try { await api.post('/ai/learning-plan', { resumeId: resume._id }); toast.success('Plan created'); plans.reload(); }
    catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };
  const toggle = async (plan, weekIndex, topicIndex, done) => {
    try { const { data } = await api.patch(`/learning-plans/${plan._id}/topic`, { weekIndex, topicIndex, done }); setLocal((l) => ({ ...l, [plan._id]: data.data.plan })); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };
  const remove = async (id) => { if (window.confirm('Delete this plan?')) { await api.delete(`/learning-plans/${id}`).catch(() => {}); plans.reload(); } };

  if (plans.loading || resumes.loading) return <Skeleton className="h-48" />;
  if (plans.error) return <ErrorState message={plans.error} onRetry={plans.reload} />;
  const list = plans.data.plans.map((p) => local[p._id] || p);

  return (
    <div className="space-y-6">
      <PageHeader title="Preparation plan" subtitle="Built from your resume, job match, practice results and mock interviews.">
        {resume && <button className="btn" onClick={generate} disabled={busy}>{busy ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}{busy ? 'Building your plan...' : 'Generate new plan'}</button>}
      </PageHeader>
      {!list.length ? <EmptyState title="No plan yet" text={resume ? 'Generate a week-by-week plan.' : 'Analyze a resume first.'} action={!resume && <Link className="btn" to="/resume">Go to resume</Link>} /> :
        list.map((p) => (
          <div key={p._id} className="card space-y-4">
            <div className="flex items-start justify-between gap-3"><div className="flex-1"><h2 className="font-semibold">{p.title}</h2>
              <div className="mt-2 flex items-center gap-3"><div className="flex-1"><ProgressBar value={p.completion} /></div><span className="text-sm">{p.completion}%</span></div></div>
              <button className="btn-ghost text-red-500" onClick={() => remove(p._id)} aria-label="Delete plan"><Trash2 size={16} /></button></div>
            {p.weeks.map((w, wi) => (
              <div key={wi}><p className="mb-1 text-sm font-medium">Week {w.week}: {w.focus}</p>
                <div className="space-y-1">{w.topics.map((t, ti) => (
                  <label key={ti} className="flex cursor-pointer items-start gap-2 rounded-lg p-2 text-sm hover:bg-slate-50 dark:hover:bg-neutral-900">
                    <input type="checkbox" className="mt-1" checked={t.done} onChange={(e) => toggle(p, wi, ti, e.target.checked)} />
                    <span className={t.done ? 'line-through opacity-60' : ''}><b>{t.title}</b>{t.description && <span className="text-slate-500"> - {t.description}</span>}</span></label>))}</div></div>))}
          </div>))}
    </div>
  );
}
