import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Bot, Loader2, Play, Send, User as UserIcon } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { Chip, ChipList, EmptyState, ErrorState, PageHeader, Section, Skeleton, Spinner, StatCard } from '../components/ui';
import FormField from '../components/FormField';

const setupSchema = z.object({
  domain: z.string().trim().min(2, 'Required'), role: z.string().trim().min(2, 'Required'),
  difficulty: z.enum(['easy', 'medium', 'hard']), type: z.enum(['hr', 'technical', 'behavioral', 'project', 'mixed']),
  totalQuestions: z.coerce.number().int().min(3).max(15),
});

function Setup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const past = useFetch('/interviews');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(setupSchema), defaultValues: { domain: user.domain || '', role: user.targetRole || '', difficulty: 'medium', type: 'mixed', totalQuestions: 5 } });
  const start = async (v) => {
    try { const { data } = await api.post('/ai/mock-interview', v); navigate(`/mock-interview/${data.data.interview._id}`); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };
  return (
    <div className="space-y-6">
      <PageHeader title="AI mock interview" subtitle="The AI plays the interviewer and adapts to your answers." />
      <form onSubmit={handleSubmit(start)} className="card grid gap-4 sm:grid-cols-2">
        <FormField label="Domain" error={errors.domain}><input className="input" {...register('domain')} /></FormField>
        <FormField label="Job role" error={errors.role}><input className="input" {...register('role')} /></FormField>
        <FormField label="Difficulty"><select className="input" {...register('difficulty')}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></FormField>
        <FormField label="Interview type"><select className="input" {...register('type')}>{['hr', 'technical', 'behavioral', 'project', 'mixed'].map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}</select></FormField>
        <FormField label="Number of questions (3-15)" error={errors.totalQuestions}><input type="number" className="input" {...register('totalQuestions')} /></FormField>
        <div className="flex items-end"><button className="btn w-full sm:w-auto" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" size={16} /> Preparing interviewer...</> : <><Play size={16} /> Start interview</>}</button></div>
      </form>
      <div>
        <h2 className="mb-2 font-semibold">Past interviews</h2>
        {past.loading ? <Skeleton /> : past.error ? <ErrorState message={past.error} onRetry={past.reload} /> :
          !past.data.interviews.length ? <EmptyState title="No interviews yet" /> : (
            <div className="space-y-2">{past.data.interviews.map((i) => (
              <Link key={i._id} to={`/mock-interview/${i._id}`} className="card flex items-center justify-between py-3 text-sm hover:border-brand-500">
                <span>{i.role} - {i.type} ({i.difficulty}) <span className="text-slate-500">{new Date(i.createdAt).toLocaleDateString()}</span></span>
                {i.status === 'completed' ? <Chip tone="good">{i.result?.overallScore}%</Chip> : <Chip tone="warn">In progress</Chip>}</Link>))}</div>)}
      </div>
    </div>
  );
}

function Report({ r }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Overall" value={`${r.overallScore}%`} /><StatCard label="Technical" value={`${r.technicalScore}%`} />
        <StatCard label="Communication" value={`${r.communicationScore}%`} /><StatCard label="Relevance" value={`${r.relevanceScore}%`} />
      </div>
      <div className="card grid gap-4 md:grid-cols-3">
        <Section title="Strong areas"><ChipList items={r.strongAreas} tone="good" /></Section>
        <Section title="Weak areas"><ChipList items={r.weakAreas} tone="bad" /></Section>
        <Section title="Recommended topics"><ChipList items={r.recommendedTopics} /></Section>
      </div>
      <div className="card"><Section title="Final feedback"><p className="whitespace-pre-wrap text-sm">{r.finalFeedback}</p></Section></div>
    </div>
  );
}

function Room({ id }) {
  const { data, loading, error, reload } = useFetch(`/interviews/${id}`);
  const [iv, setIv] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState('');
  const endRef = useRef(null);
  useEffect(() => { if (data) setIv(data.interview); }, [data]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [iv, busy]);

  const call = async (path, body, label) => {
    setBusy(label);
    try { const { data: res } = await api.post(`/interviews/${id}/${path}`, body); setIv(res.data.interview); setText(''); }
    catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(''); }
  };
  if (loading) return <Spinner label="Loading interview..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!iv) return null;
  const answered = iv.turns.filter((t) => t.role === 'candidate').length;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title={`${iv.role} interview`} subtitle={`${iv.type} - ${iv.difficulty} - ${answered}/${iv.totalQuestions} answered`}>
        <Link className="btn-ghost" to="/mock-interview">All interviews</Link>
      </PageHeader>
      <div className="card space-y-4">
        {iv.turns.map((t, i) => (
          <div key={i} className={`flex gap-3 ${t.role === 'candidate' ? 'flex-row-reverse' : ''}`}>
            <div className="mt-1 text-brand-600">{t.role === 'candidate' ? <UserIcon size={18} /> : <Bot size={18} />}</div>
            <div className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${t.role === 'candidate' ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-neutral-900'}`}>
              {t.reaction && <p className="mb-1 italic opacity-80">{t.reaction}</p>}{t.content}</div>
          </div>))}
        {busy && <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={16} />{busy}</p>}
        <div ref={endRef} />
      </div>
      {iv.status === 'in_progress' ? (
        <div className="card space-y-2">
          <textarea className="input min-h-[110px]" placeholder="Type your answer..." value={text} maxLength={5000} onChange={(e) => setText(e.target.value)} disabled={!!busy} />
          <div className="flex flex-wrap gap-2">
            <button className="btn" disabled={!!busy || !text.trim()} onClick={() => call('answer', { answer: text }, answered + 1 >= iv.totalQuestions ? 'Generating your final report...' : 'Interviewer is thinking...')}><Send size={16} /> Send</button>
            {answered > 0 && <button className="btn-ghost" disabled={!!busy} onClick={() => call('finish', {}, 'Generating your final report...')}>End & get report</button>}
          </div>
        </div>
      ) : iv.result && <Report r={iv.result} />}
    </div>
  );
}

export default function MockInterviewPage() {
  const { id } = useParams();
  return id ? <Room key={id} id={id} /> : <Setup />;
}
