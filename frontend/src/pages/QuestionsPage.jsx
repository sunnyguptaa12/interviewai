import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Flag, FolderOpen, Play, Plus, Search, Sparkles } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useDebounce, useFetch } from '../hooks/useFetch';
import { Chip, EmptyState, ErrorState, PageHeader, ProgressBar, Skeleton, Spinner, difficultyTone } from '../components/ui';

const TYPE_LABEL = { hr: 'HR', domain: 'Domain', skill: 'Skill', project: 'Project', resume: 'Resume', behavioral: 'Behavioral' };

export default function QuestionsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const category = params.get('category');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const q = useDebounce(search);

  const resumes = useFetch('/resumes');
  const resume = resumes.data?.resumes?.find((r) => r.status === 'analyzed');
  const folders = useFetch('/questions/categories');
  const list = useFetch(category ? '/questions' : null, { category, difficulty: difficulty || undefined, status: status || undefined, search: q || undefined, page, limit: 15 });

  const generate = async (cat) => {
    setBusy(true);
    try {
      const { data } = await api.post('/ai/generate-questions', { resumeId: resume._id, ...(cat && { category: cat }) });
      toast.success(`${data.data.created} new questions`); folders.reload(); list.reload();
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };
  const report = async (id) => {
    const reason = window.prompt('Why are you reporting this question?'); if (reason === null) return;
    try { await api.post(`/questions/${id}/report`, { reason }); toast.success('Reported to admins'); } catch (e) { toast.error(getErrorMessage(e)); }
  };

  if (folders.loading || resumes.loading) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} />)}</div>;
  if (folders.error) return <ErrorState message={folders.error} onRetry={folders.reload} />;
  const cats = folders.data.categories;

  if (busy) return <Spinner label="Generating personalized questions..." />;

  if (!category) return (
    <div>
      <PageHeader title="Interview questions" subtitle="Folders are generated from your own resume and domain.">
        {resume && <button className="btn" onClick={() => generate()}><Sparkles size={16} /> {cats.length ? 'Generate more' : 'Generate questions'}</button>}
      </PageHeader>
      {!cats.length ? (
        <EmptyState title="No questions yet" text={resume ? 'Generate a personalized question bank from your resume.' : 'Upload and analyze a resume first.'}
          action={resume ? <button className="btn" onClick={() => generate()}><Sparkles size={16} /> Generate questions</button> : <Link className="btn" to="/resume">Go to resume</Link>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cats.map((c) => (
            <button key={c.name} onClick={() => setParams({ category: c.name })} className="card text-left transition hover:border-brand-500">
              <div className="mb-2 flex items-center justify-between"><FolderOpen className="text-brand-600" size={22} /><Chip>{TYPE_LABEL[c.type]}</Chip></div>
              <p className="font-medium">{c.name}</p>
              <p className="mb-2 text-xs text-slate-500">{c.total} questions - {c.difficulty.easy}E / {c.difficulty.medium}M / {c.difficulty.hard}H</p>
              <ProgressBar value={(c.attempted / c.total) * 100} />
              <p className="mt-1 text-xs text-slate-500">{c.attempted}/{c.total} attempted</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const items = list.data?.items || [];
  const pg = list.data?.pagination;
  const practiceUrl = (extra = '') => `/practice?category=${encodeURIComponent(category)}${difficulty ? `&difficulty=${difficulty}` : ''}${extra}`;
  return (
    <div className="space-y-4">
      <PageHeader title={category} subtitle="Filter, search and practice this folder.">
        <button className="btn-ghost" onClick={() => setParams({})}><ArrowLeft size={16} /> All folders</button>
        {resume && <button className="btn-ghost" onClick={() => generate(category)}><Plus size={16} /> More questions</button>}
        <button className="btn" onClick={() => navigate(practiceUrl())}><Play size={16} /> Practice</button>
      </PageHeader>
      <div className="card flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1"><Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input className="input pl-9" placeholder="Search questions" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
        <select className="input w-auto" value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}>
          <option value="">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All</option><option value="attempted">Attempted</option><option value="unattempted">Unattempted</option></select>
      </div>
      {list.loading ? <Spinner label="Loading questions..." /> : list.error ? <ErrorState message={list.error} onRetry={list.reload} /> :
        !items.length ? <EmptyState title="No questions match" text="Try different filters." /> : (
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it._id} className="card flex items-start justify-between gap-3 py-3">
                <button className="flex-1 text-left" onClick={() => navigate(practiceUrl(`&focus=${it._id}`))}>
                  <p className="text-sm font-medium">{it.question}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2"><Chip tone={difficultyTone[it.difficulty]}>{it.difficulty}</Chip>
                    {it.skill && <Chip>{it.skill}</Chip>}{it.lastScore != null && <Chip tone={it.lastScore >= 6 ? 'good' : 'bad'}>Last score {it.lastScore}/10</Chip>}</div>
                </button>
                <button className="btn-ghost" onClick={() => report(it._id)} aria-label="Report question"><Flag size={15} /></button>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 text-sm">
              <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span className="text-slate-500">Page {pg.page} of {pg.pages} ({pg.total} questions)</span>
              <button className="btn-ghost" disabled={page >= pg.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>)}
    </div>
  );
}
