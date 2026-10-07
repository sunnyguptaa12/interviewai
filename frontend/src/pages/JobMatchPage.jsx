import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Briefcase, Loader2, Sparkles, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { Chip, ChipList, EmptyState, ErrorState, PageHeader, ProgressBar, Section, Skeleton } from '../components/ui';

export default function JobMatchPage() {
  const navigate = useNavigate();
  const resumes = useFetch('/resumes');
  const jobs = useFetch('/job-descriptions');
  const resume = resumes.data?.resumes?.find((r) => r.status === 'analyzed');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState('');
  const [selected, setSelected] = useState(null);

  const run = async () => {
    const form = new FormData();
    form.append('resumeId', resume._id);
    if (title) form.append('title', title);
    if (file) form.append('file', file); else form.append('jobDescriptionText', text);
    setBusy('Comparing your resume with the job...');
    try { const { data } = await api.post('/ai/job-match', form); setSelected(data.data.jobDescription); jobs.reload(); toast.success('Match complete'); }
    catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(''); }
  };
  const questions = async () => {
    setBusy('Generating personalized questions...');
    try { await api.post('/ai/generate-questions', { resumeId: resume._id, jobDescriptionId: selected._id }); toast.success('Job-focused questions added'); navigate('/questions'); }
    catch (e) { toast.error(getErrorMessage(e)); setBusy(''); }
  };
  const plan = async () => {
    setBusy('Building your preparation plan...');
    try { await api.post('/ai/learning-plan', { resumeId: resume._id, jobDescriptionId: selected._id }); navigate('/learning-plan'); }
    catch (e) { toast.error(getErrorMessage(e)); setBusy(''); }
  };
  const remove = async (id) => { await api.delete(`/job-descriptions/${id}`).catch(() => {}); if (selected?._id === id) setSelected(null); jobs.reload(); };

  if (resumes.loading) return <Skeleton className="h-48" />;
  if (resumes.error) return <ErrorState message={resumes.error} onRetry={resumes.reload} />;
  if (!resume) return <EmptyState title="Analyze a resume first" action={<Link className="btn" to="/resume">Go to resume</Link>} />;
  const m = selected?.match;

  return (
    <div className="space-y-6">
      <PageHeader title="Job description match" subtitle="See how well your resume fits a job and what to prepare." />
      <div className="card space-y-3">
        <input className="input" placeholder="Job title (optional)" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="input min-h-[160px]" placeholder="Paste the job description here..." value={text} maxLength={20000} onChange={(e) => setText(e.target.value)} disabled={!!file} />
        <div className="flex flex-wrap items-center gap-3 text-sm"><span className="text-slate-500">or upload</span>
          <input type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files[0] || null)} />{file && <button className="btn-ghost" onClick={() => setFile(null)}>Clear</button>}</div>
        <button className="btn" disabled={!!busy || (!file && text.trim().length < 50)} onClick={run}>{busy ? <Loader2 className="animate-spin" size={16} /> : <Briefcase size={16} />}{busy || 'Analyze match'}</button>
      </div>

      {m && (
        <div className="space-y-4">
          <div className="card"><div className="flex items-end justify-between"><div><p className="text-sm text-slate-500">{selected.title}</p><p className="text-4xl font-semibold">{m.matchPercentage}%</p><p className="text-sm text-slate-500">overall match</p></div>
            <div className="flex gap-2"><button className="btn" disabled={!!busy} onClick={questions}><Sparkles size={16} /> Job-focused questions</button><button className="btn-ghost" disabled={!!busy} onClick={plan}>Create study plan</button></div></div>
            <div className="mt-3"><ProgressBar value={m.matchPercentage} /></div></div>
          <div className="card grid gap-5 md:grid-cols-2">
            <Section title="Matching skills"><ChipList items={m.matchingSkills} tone="good" /></Section>
            <Section title="Missing skills"><ChipList items={m.missingSkills} tone="bad" /></Section>
            <Section title="Required skills"><ChipList items={m.requiredSkills} /></Section>
            <Section title="Your strengths"><ChipList items={m.strengths} tone="good" /></Section>
            <Section title="Skill gaps"><ul className="list-disc pl-5 text-sm">{m.skillGaps.map((g) => <li key={g}>{g}</li>)}</ul></Section>
            <Section title="Interview focus areas"><ChipList items={m.interviewFocusAreas} tone="warn" /></Section>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 font-semibold">Previous matches</h2>
        {jobs.loading ? <Skeleton /> : !jobs.data?.jobDescriptions?.length ? <p className="text-sm text-slate-500">None yet.</p> : (
          <div className="space-y-2">{jobs.data.jobDescriptions.map((j) => (
            <div key={j._id} className="card flex items-center justify-between py-3 text-sm">
              <button className="flex-1 text-left" onClick={() => setSelected(j)}>{j.title} <span className="text-slate-500">{new Date(j.createdAt).toLocaleDateString()}</span></button>
              <Chip tone={j.matchPercentage >= 70 ? 'good' : 'warn'}>{j.matchPercentage}%</Chip>
              <button className="btn-ghost text-red-500" onClick={() => remove(j._id)} aria-label="Delete"><Trash2 size={15} /></button></div>))}</div>)}
      </div>
    </div>
  );
}
