import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { BarBox, LineBox } from '../components/Charts';
import { ChipList, EmptyState, ErrorState, PageHeader, ProgressBar, Section, Skeleton, StatCard } from '../components/ui';

export default function Dashboard() {
  const { user } = useAuth();
  const progress = useFetch('/progress');
  const analytics = useFetch('/analytics');
  if (progress.loading || analytics.loading) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <Skeleton key={i} />)}</div>;
  if (progress.error || analytics.error) return <ErrorState message={progress.error || analytics.error} onRetry={() => { progress.reload(); analytics.reload(); }} />;
  const p = progress.data; const a = analytics.data; const r = p.resume;

  if (!r) return (
    <div><PageHeader title={`Welcome, ${user.name}`} subtitle="Let's start with your resume." />
      <EmptyState title="Upload your resume" text="The AI will detect your domain and build a personalized interview plan." action={<Link className="btn" to="/resume">Upload resume</Link>} /></div>);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={`${r.domain}${r.targetRole ? ` - ${r.targetRole}` : ''}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Resume score" value={`${r.score}/100`} hint={r.level} />
        <StatCard label="Domain" value={r.domain} hint={r.targetRole} />
        <StatCard label="Average answer score" value={a.totals.averageScore != null ? `${a.totals.averageScore}%` : '-'} />
        <StatCard label="Job match" value={p.jobMatch ? `${p.jobMatch.percentage}%` : '-'} hint={p.jobMatch?.title} />
        <StatCard label="Questions attempted" value={`${p.questions.attempted}/${p.questions.total}`} hint={`${p.questions.completion}% completed`} />
        <StatCard label="Mock interviews" value={a.totals.mockInterviews} hint={a.interviewAverage != null ? `avg ${a.interviewAverage}%` : undefined} />
        <StatCard label="Interview score" value={a.interviews.length ? `${a.interviews.at(-1).overall}%` : '-'} hint="latest" />
        <div className="card"><p className="text-xs uppercase tracking-wide text-slate-500">Learning progress</p>
          <p className="mt-1 text-2xl font-semibold">{p.learningPlan ? `${p.learningPlan.completion}%` : '-'}</p>{p.learningPlan ? <ProgressBar value={p.learningPlan.completion} /> : <Link className="text-xs text-brand-600" to="/learning-plan">Create a plan</Link>}</div>
      </div>
      <div className="card grid gap-5 md:grid-cols-2">
        <Section title="Skill strengths"><ChipList items={r.strengths.length ? r.strengths : r.skills} tone="good" /></Section>
        <Section title="Weak skills"><ChipList items={a.weakest.length ? a.weakest.map((c) => `${c.name} ${c.score}%`) : r.missingSkills} tone="bad" /></Section>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarBox title="Skill performance (%)" data={a.categories.filter((c) => c.type === 'skill' || c.type === 'domain')} horizontal />
        <BarBox title="Category performance (%)" data={a.categories} horizontal />
        <LineBox title="Interview score trend (%)" data={a.interviews.map((i, n) => ({ name: `#${n + 1}`, overall: i.overall }))} x="name" y="overall" />
        <BarBox title="Questions completed per category (%)" data={p.categories.map((c) => ({ name: c.name, score: c.completion }))} horizontal />
        <BarBox title="Weekly progress (questions answered)" data={a.weekly} x="week" y="answered" />
      </div>
    </div>
  );
}
