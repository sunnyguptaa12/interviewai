import { useState } from 'react';
import toast from 'react-hot-toast';
import { Brain, Loader2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { BarBox, LineBox, RadarBox } from '../components/Charts';
import { ChipList, EmptyState, ErrorState, PageHeader, Section, Skeleton, StatCard } from '../components/ui';
import { Link } from 'react-router-dom';

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export default function AnalyticsPage() {
  const { data: a, loading, error, reload } = useFetch('/analytics');
  const [rec, setRec] = useState(null);
  const [busy, setBusy] = useState(false);

  const recommend = async () => {
    setBusy(true);
    try { setRec((await api.post('/ai/recommendations')).data.data.recommendations); } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };

  if (loading) return <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-64" />)}</div>;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!a.totals.attempted && !a.interviews.length) return <EmptyState title="No practice data yet" text="Answer a few questions or take a mock interview to see analytics." action={<Link className="btn" to="/questions">Start practicing</Link>} />;

  const dims = a.dimensions && [{ name: 'Technical', score: a.dimensions.technical }, { name: 'Communication', score: a.dimensions.communication },
    { name: 'Relevance', score: a.dimensions.relevance }, { name: 'Clarity', score: a.dimensions.clarity }, { name: 'Completeness', score: a.dimensions.completeness }];
  const skillCats = a.categories.filter((c) => c.type === 'skill' || c.type === 'domain');

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Your performance across questions and mock interviews.">
        <button className="btn" onClick={recommend} disabled={busy}>{busy ? <Loader2 className="animate-spin" size={16} /> : <Brain size={16} />} {busy ? 'Analyzing...' : 'AI recommendations'}</button>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Questions attempted" value={a.totals.attempted} hint={`${a.totals.skipped} skipped`} />
        <StatCard label="Satisfactory answers" value={a.totals.correct} hint="score 6/10 or higher" />
        <StatCard label="Average score" value={a.totals.averageScore != null ? `${a.totals.averageScore}%` : '-'} hint={a.improvement != null ? `${a.improvement >= 0 ? '+' : ''}${a.improvement}% vs previous 10` : undefined} />
        <StatCard label="Mock interviews" value={a.totals.mockInterviews} hint={a.interviewAverage != null ? `avg ${a.interviewAverage}%` : undefined} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <RadarBox title="Skill dimensions" data={dims} />
        <BarBox title="Category-wise score (%)" data={a.categories} horizontal />
        <BarBox title="Difficulty-wise score (%)" data={a.difficulty.map((d) => ({ ...d, name: cap(d.name) }))} />
        <LineBox title="Answer score over time (%)" data={a.trend} x="date" y="score" />
        <BarBox title="Weekly questions answered" data={a.weekly} x="week" y="answered" />
        <LineBox title="Mock interview scores (%)" data={a.interviews.map((i, n) => ({ ...i, name: `#${n + 1}` }))} x="name" y="overall" />
      </div>
      <div className="card grid gap-5 md:grid-cols-2">
        <Section title="Strongest categories"><ChipList items={a.strongest.map((c) => `${c.name} ${c.score}%`)} tone="good" /></Section>
        <Section title="Weakest categories"><ChipList items={a.weakest.map((c) => `${c.name} ${c.score}%`)} tone="bad" /></Section>
        {skillCats.length > 0 && <Section title="Skill & domain scores"><ChipList items={skillCats.map((c) => `${c.name} ${c.score}%`)} /></Section>}
      </div>
      {rec && (
        <div className="card space-y-4">
          <h3 className="font-semibold">AI recommendations</h3><p className="text-sm">{rec.summary}</p>
          <div className="grid gap-5 md:grid-cols-2">
            <Section title="Topics to study"><ChipList items={rec.topicsToStudy} /></Section>
            <Section title="Skills to improve"><ChipList items={rec.skillsToImprove} tone="warn" /></Section>
            <Section title="Questions to practice"><ul className="list-disc pl-5 text-sm">{rec.questionsToPractice.map((q, i) => <li key={i}><Link className="text-brand-600" to={`/questions?category=${encodeURIComponent(q.category)}`}>{q.count} x {q.category}</Link> - {q.reason}</li>)}</ul></Section>
            <Section title="Resume improvements"><ul className="list-disc pl-5 text-sm">{rec.resumeImprovements.map((r) => <li key={r}>{r}</li>)}</ul></Section>
          </div>
          <Section title="Preparation strategy"><ol className="list-decimal pl-5 text-sm">{rec.strategy.map((s) => <li key={s}>{s}</li>)}</ol></Section>
        </div>
      )}
    </div>
  );
}
