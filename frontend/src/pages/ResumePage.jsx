import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, Eye, FileUp, Lightbulb, Loader2, RefreshCw, Sparkles, Trash2, UploadCloud } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { downloadFile, fetchBlob } from '../utils/files';
import { ChipList, EmptyState, ErrorState, Modal, PageHeader, ProgressBar, Section, Skeleton, StatCard } from '../components/ui';

const MAX_MB = 5;
const validFile = (f) => {
  if (!/\.(pdf|docx)$/i.test(f.name)) return 'Only PDF and DOCX files are allowed';
  if (f.size > MAX_MB * 1024 * 1024) return `File is larger than ${MAX_MB} MB`;
  return '';
};

export default function ResumePage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { data, loading, error, reload } = useFetch('/resumes');
  const resume = data?.resumes?.[0];
  const analysisFetch = useFetch(resume?.status === 'analyzed' ? `/resumes/${resume._id}/analysis` : null);
  const analysis = analysisFetch.data?.analysis;
  const [busy, setBusy] = useState('');   // '', 'upload', 'analyze', 'questions', 'improve'
  const [progress, setProgress] = useState(0);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState(null);
  const [improvements, setImprovements] = useState(null);

  useEffect(() => { setImprovements(analysis?.improvements || null); }, [analysis]);

  const runAnalysis = async (id) => {
    setBusy('analyze');
    try { await api.post('/ai/analyze-resume', { resumeId: id }); toast.success('Resume analyzed'); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setBusy(''); reload(); analysisFetch.reload(); }
  };

  const upload = async (file) => {
    const problem = validFile(file);
    if (problem) return toast.error(problem);
    const form = new FormData(); form.append('resume', file);
    setBusy('upload'); setProgress(0);
    try {
      const { data: res } = await api.post('/resumes/upload', form, { onUploadProgress: (e) => setProgress(Math.round((e.loaded / (e.total || file.size)) * 100)) });
      const old = resume?._id;
      if (old) await api.delete(`/resumes/${old}`).catch(() => {}); // replace
      await runAnalysis(res.data.resume._id);
    } catch (e) { toast.error(getErrorMessage(e)); setBusy(''); }
  };

  const openPreview = async () => {
    try {
      if (/pdf/.test(resume.mimeType)) setPreview({ type: 'pdf', url: URL.createObjectURL(await fetchBlob(`/resumes/${resume._id}/file`)) });
      else setPreview({ type: 'text', text: (await api.get(`/resumes/${resume._id}`, { params: { includeText: 1 } })).data.data.resume.extractedText });
    } catch (e) { toast.error(getErrorMessage(e)); }
  };
  const closePreview = () => { if (preview?.url) URL.revokeObjectURL(preview.url); setPreview(null); };

  const remove = async () => {
    if (!window.confirm('Delete this resume and its analysis? Generated questions are kept.')) return;
    try { await api.delete(`/resumes/${resume._id}`); toast.success('Resume deleted'); reload(); } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const generate = async () => {
    setBusy('questions');
    try { const { data: r } = await api.post('/ai/generate-questions', { resumeId: resume._id }); toast.success(`${r.data.created} questions generated`); navigate('/questions'); }
    catch (e) { toast.error(getErrorMessage(e)); setBusy(''); }
  };

  const improve = async () => {
    setBusy('improve');
    try { setImprovements((await api.post('/ai/resume-improvement', { resumeId: resume._id })).data.data.improvements); }
    catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(''); }
  };

  if (loading) return <Skeleton className="h-64" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const a = analysis?.data;
  const label = { upload: `Uploading... ${progress}%`, analyze: 'Analyzing your resume...', questions: 'Generating personalized questions...', improve: 'Reviewing your resume...' }[busy];

  return (
    <div className="space-y-6">
      <PageHeader title="Resume" subtitle="Upload your resume. The AI detects your domain and builds your interview prep around it.">
        {resume && <>
          <button className="btn-ghost" onClick={openPreview}><Eye size={16} /> Preview</button>
          <button className="btn-ghost" onClick={() => downloadFile(`/resumes/${resume._id}/download`, resume.originalName)}><Download size={16} /> Download</button>
          <button className="btn-ghost text-red-500" onClick={remove}><Trash2 size={16} /> Delete</button>
        </>}
      </PageHeader>

      <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) upload(e.dataTransfer.files[0]); }}
        className={`card flex flex-col items-center gap-3 border-2 border-dashed py-10 text-center ${drag ? 'border-brand-500 bg-brand-50 dark:bg-neutral-900' : ''}`}>
        {busy ? <><Loader2 className="animate-spin text-brand-600" size={28} /><p className="text-sm">{label}</p>{busy === 'upload' && <div className="w-64"><ProgressBar value={progress} /></div>}</> : <>
          <UploadCloud size={30} className="text-brand-600" />
          <p className="font-medium">{resume ? 'Replace your resume' : 'Drag & drop your resume here'}</p>
          <p className="text-xs text-slate-500">PDF or DOCX, up to {MAX_MB} MB</p>
          <button className="btn" onClick={() => inputRef.current.click()}><FileUp size={16} /> Browse files</button>
        </>}
        <input ref={inputRef} type="file" hidden accept=".pdf,.docx" onChange={(e) => { if (e.target.files[0]) upload(e.target.files[0]); e.target.value = ''; }} />
      </div>

      {!resume && <EmptyState title="No resume yet" text="Upload a resume to unlock questions, mock interviews and analytics." />}

      {resume && resume.status !== 'analyzed' && !busy && (
        <div className="card flex flex-wrap items-center justify-between gap-3">
          <div><p className="font-medium">{resume.originalName}</p>
            <p className="text-sm text-slate-500">{resume.status === 'failed' ? `Analysis failed: ${resume.error}` : 'Uploaded, not analyzed yet'}</p></div>
          <button className="btn" onClick={() => runAnalysis(resume._id)}><RefreshCw size={16} /> Analyze resume</button>
        </div>
      )}

      {analysisFetch.loading && resume?.status === 'analyzed' && <Skeleton className="h-48" />}
      {a && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Detected domain" value={a.domain} hint={a.subDomain} />
            <StatCard label="Target role" value={a.targetRole || '-'} />
            <StatCard label="Experience level" value={a.experienceLevel || '-'} />
            <StatCard label="Resume score" value={`${a.resumeScore}/100`} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn" disabled={!!busy} onClick={generate}><Sparkles size={16} /> Generate interview questions</button>
            <button className="btn-ghost" disabled={!!busy} onClick={improve}><Lightbulb size={16} /> {busy === 'improve' ? 'Reviewing...' : 'Improve my resume'}</button>
          </div>
          <div className="card grid gap-5 md:grid-cols-2">
            <Section title="Technical skills"><ChipList items={a.technicalSkills?.length ? a.technicalSkills : a.skills} /></Section>
            <Section title="Soft skills"><ChipList items={a.softSkills} /></Section>
            <Section title="Tools & technologies"><ChipList items={[...new Set([...(a.tools || []), ...(a.technologies || [])])]} /></Section>
            <Section title="Certifications"><ChipList items={a.certifications} /></Section>
            <Section title="Strengths"><ChipList items={a.strengths} tone="good" /></Section>
            <Section title="Missing / weak skills"><ChipList items={a.missingSkills} tone="warn" /></Section>
            <Section title="Possible roles"><ChipList items={a.possibleRoles} /></Section>
            <Section title="Claims an interviewer may challenge"><ChipList items={a.claimsToChallenge} tone="bad" /></Section>
          </div>
          <div className="card grid gap-5 md:grid-cols-2">
            <Section title="Projects">{a.projects?.length ? a.projects.map((p) => (
              <div key={p.name} className="mb-3"><p className="text-sm font-medium">{p.name}</p><p className="text-xs text-slate-500">{p.description}</p><ChipList items={p.technologies} /></div>)) : <p className="text-sm text-slate-500">None found</p>}</Section>
            <Section title="Experience & internships">{[...(a.experience || []), ...(a.internships || [])].length ? [...(a.experience || []), ...(a.internships || [])].map((e, i) => (
              <div key={i} className="mb-3"><p className="text-sm font-medium">{e.title} {e.company && `- ${e.company}`}</p><p className="text-xs text-slate-500">{e.duration}</p></div>)) : <p className="text-sm text-slate-500">None found</p>}</Section>
            <Section title="Education">{a.education?.length ? a.education.map((e, i) => <p key={i} className="text-sm">{e.degree} - {e.institution} {e.year}</p>) : <p className="text-sm text-slate-500">None found</p>}</Section>
            <Section title="Achievements">{a.achievements?.length ? <ul className="list-disc pl-5 text-sm">{a.achievements.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="text-sm text-slate-500">None found</p>}</Section>
          </div>
          {improvements && (
            <div className="card space-y-3">
              <h3 className="font-semibold">Resume improvement suggestions</h3>
              <p className="text-sm">{improvements.overallAssessment}</p>
              {improvements.improvements.map((i, n) => <div key={n} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-neutral-900"><b>{i.section}:</b> {i.issue}<br /><span className="text-emerald-600 dark:text-emerald-400">Suggestion: {i.suggestion}</span></div>)}
              {improvements.rewrittenSummary && <Section title="Suggested summary"><p className="text-sm italic">{improvements.rewrittenSummary}</p></Section>}
              <Section title="ATS keywords"><ChipList items={improvements.atsKeywords} /></Section>
            </div>
          )}
        </div>
      )}

      {preview && <Modal title={resume.originalName} onClose={closePreview}>
        {preview.type === 'pdf' ? <iframe title="Resume preview" src={preview.url} className="h-[70vh] w-full rounded" /> : <pre className="whitespace-pre-wrap text-sm">{preview.text}</pre>}
      </Modal>}
    </div>
  );
}
