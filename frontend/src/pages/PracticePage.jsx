import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Lightbulb, Loader2, SkipForward } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { Chip, EmptyState, ErrorState, ProgressBar, Section, Spinner, difficultyTone } from '../components/ui';

export default function PracticePage() {
  const [params] = useSearchParams();
  const { data, loading, error, reload } = useFetch('/questions', {
    category: params.get('category') || undefined, difficulty: params.get('difficulty') || undefined, limit: 100 });
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [done, setDone] = useState(0);

  const items = data?.items || [];
  useEffect(() => {
    const focus = params.get('focus');
    const i = items.findIndex((x) => x._id === focus);
    setIndex(i >= 0 ? i : 0);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => { setIndex((i) => i + 1); setAnswer(''); setHint(false); setResult(null); };
  const submit = async (skipped) => {
    setBusy(true);
    try {
      const body = skipped ? { questionId: items[index]._id, skipped: true } : { questionId: items[index]._id, answer };
      const { data: res } = await api.post('/answers', body);
      if (skipped) return next();
      setResult(res.data.answer.evaluation); setDone((d) => d + 1);
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };

  if (loading) return <Spinner label="Loading questions..." />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!items.length) return <EmptyState title="No questions to practice" action={<Link className="btn" to="/questions">Back to folders</Link>} />;
  if (index >= items.length) return <EmptyState title="Session complete" text={`You answered ${done} question(s) this session.`}
    action={<div className="flex gap-2"><Link className="btn" to="/analytics">View analytics</Link><Link className="btn-ghost" to="/questions">Folders</Link></div>} />;

  const q = items[index];
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between text-sm"><span className="text-slate-500">{q.category}</span><Link className="text-brand-600" to="/questions">Exit</Link></div>
      <ProgressBar value={((index + 1) / items.length) * 100} />
      <div className="card space-y-3">
        <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">Question {index + 1}/{items.length}</span>
          <Chip tone={difficultyTone[q.difficulty]}>{q.difficulty}</Chip>{q.skill && <Chip>{q.skill}</Chip>}</div>
        <p className="text-lg">{q.question}</p>
        {hint && <p className="rounded-lg bg-amber-50 p-3 text-sm dark:bg-neutral-900">Hint: {q.hint || 'No hint available for this question.'}</p>}
      </div>

      {!result ? (
        <div className="card space-y-3">
          <textarea className="input min-h-[160px]" placeholder="Type your answer..." value={answer} maxLength={5000} onChange={(e) => setAnswer(e.target.value)} disabled={busy} />
          <div className="flex flex-wrap gap-2">
            <button className="btn" disabled={busy || !answer.trim()} onClick={() => submit(false)}>{busy && <Loader2 size={16} className="animate-spin" />}{busy ? 'Evaluating your answer...' : 'Submit answer'}</button>
            <button className="btn-ghost" disabled={busy} onClick={() => setHint(true)}><Lightbulb size={16} /> Show hint</button>
            <button className="btn-ghost" disabled={busy} onClick={() => submit(true)}><SkipForward size={16} /> Skip</button>
          </div>
        </div>
      ) : (
        <div className="card space-y-4">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Evaluation</h3>
            <span className={`text-2xl font-semibold ${result.score >= 6 ? 'text-emerald-500' : 'text-red-500'}`}>{result.score}/10</span></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 text-center text-sm">
            {[['Accuracy', result.technicalAccuracy], ['Relevance', result.relevance], ['Completeness', result.completeness], ['Clarity', result.clarity], ['Communication', result.communication]].map(([l, v]) => (
              <div key={l} className="rounded-lg bg-slate-50 p-2 dark:bg-neutral-900"><p className="text-xs text-slate-500">{l}</p><p className="font-semibold">{v}/10</p></div>))}
          </div>
          <Section title="Strengths">{result.strengths.length ? <ul className="list-disc pl-5 text-sm">{result.strengths.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="text-sm text-slate-500">-</p>}</Section>
          <Section title="Missing concepts"><div className="flex flex-wrap gap-1.5">{result.missingConcepts.map((c) => <Chip key={c} tone="warn">{c}</Chip>)}{!result.missingConcepts.length && <p className="text-sm text-slate-500">None</p>}</div></Section>
          <Section title="How to improve">{<ul className="list-disc pl-5 text-sm">{result.improvements.map((s) => <li key={s}>{s}</li>)}</ul>}</Section>
          <Section title="A better answer"><p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm dark:bg-neutral-900">{result.betterAnswer}</p></Section>
          <button className="btn" onClick={next}>Next question <ArrowRight size={16} /></button>
        </div>
      )}
      {!result && <button className="btn-ghost" disabled={busy} onClick={next}>Next question <ArrowRight size={16} /></button>}
    </div>
  );
}
