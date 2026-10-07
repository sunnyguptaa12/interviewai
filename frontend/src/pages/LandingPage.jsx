import { Link, Navigate } from 'react-router-dom';
import {
  ArrowDownRight, ArrowRight, BarChart3, BrainCircuit, BriefcaseBusiness,
  Check, FileText, Moon, Sparkles, Sun, Target, Upload, WandSparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const features = [
  {
    icon: FileText,
    title: 'Resume-aware practice',
    description: 'Turn your experience, projects, and skills into interview questions tailored to you.',
  },
  {
    icon: BrainCircuit,
    title: 'Useful AI feedback',
    description: 'Get clear notes on answer quality, what you missed, and how to improve next time.',
  },
  {
    icon: Target,
    title: 'A plan you can follow',
    description: 'Find skill gaps, compare yourself to a role, and build a focused preparation plan.',
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-950 transition-colors dark:bg-black dark:text-neutral-100">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><BrainCircuit size={20} /></span>
          <span>Interview<span className="text-brand-600">Path</span></span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <button className="btn-ghost rounded-full" onClick={toggle} aria-label="Toggle theme">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link to="/login" className="hidden px-3 py-2 text-sm font-medium hover:text-brand-600 sm:inline-flex">Sign in</Link>
          <Link to="/register" className="btn rounded-full px-5">Create account <ArrowRight size={16} /></Link>
        </nav>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:min-h-[650px] lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:pb-28">
          <div className="pointer-events-none absolute -left-40 top-12 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-500/15" />
          <div className="relative">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
              <Sparkles size={14} /> A smarter way to prepare
            </div>
            <h1 className="max-w-3xl text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              Make your next interview feel <span className="text-brand-600">familiar.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 dark:text-neutral-400 sm:text-lg sm:leading-8">
              Practice with questions built around your resume, get thoughtful AI feedback, and turn your weak spots into a clear preparation plan.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register" className="btn rounded-xl px-6 py-3 text-base shadow-lg shadow-brand-600/20">
                Start preparing <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold transition hover:border-brand-300 dark:border-neutral-800 dark:hover:border-neutral-600">
                I have an account
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-neutral-500">
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> Resume-personalized</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> Practice at your pace</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-500" /> Track your progress</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-500/20 via-violet-500/10 to-transparent blur-2xl" />
            <div className="relative rounded-[1.75rem] border border-slate-200 bg-white/90 p-3 shadow-2xl shadow-slate-900/10 dark:border-neutral-800 dark:bg-neutral-950/90 dark:shadow-black/50 sm:p-5">
              <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-4 dark:border-neutral-800">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-neutral-500">YOUR PREP SNAPSHOT</p>
                  <p className="mt-1 font-semibold">Full-stack developer</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">On track</span>
              </div>
              <div className="grid grid-cols-2 gap-3 py-4">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-neutral-900">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400"><span>Answer confidence</span><BarChart3 size={15} /></div>
                  <div className="mt-3 flex items-end gap-2"><span className="text-3xl font-bold">78</span><span className="pb-1 text-sm text-slate-500">/100</span></div>
                  <div className="mt-3 h-1.5 rounded-full bg-slate-200 dark:bg-neutral-800"><div className="h-full w-[78%] rounded-full bg-brand-600" /></div>
                </div>
                <div className="rounded-2xl bg-brand-50 p-4 dark:bg-brand-500/10">
                  <div className="flex items-center justify-between text-xs text-brand-700 dark:text-brand-300"><span>Next best step</span><WandSparkles size={15} /></div>
                  <p className="mt-3 text-sm font-semibold leading-5">Practice explaining your recent project</p>
                  <p className="mt-2 text-xs text-brand-700/70 dark:text-brand-200/70">Based on your resume</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"><BriefcaseBusiness size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500 dark:text-neutral-500">PRACTICE QUESTION</p>
                    <p className="mt-1 text-sm font-medium">How did you decide what to build first?</p>
                  </div>
                  <ArrowDownRight size={17} className="shrink-0 text-brand-600" />
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-neutral-800 dark:text-neutral-500">
                  <Upload size={14} /> Questions shaped by your resume and goals
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium shadow-lg dark:border-neutral-800 dark:bg-neutral-900 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Check size={15} /></span>
              One step closer to interview-ready
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50/80 dark:border-neutral-900 dark:bg-neutral-950/60">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-600">Prepare with purpose</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Your experience is the starting point.</h2>
              <p className="mt-4 leading-7 text-slate-600 dark:text-neutral-400">Move beyond generic question lists. Build confidence through a practice loop that adapts to your background and the role you want.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description }, index) => (
                <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-neutral-800 dark:bg-black">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"><Icon size={21} /></div>
                  <p className="mt-5 text-xs font-semibold tracking-widest text-slate-400 dark:text-neutral-600">0{index + 1}</p>
                  <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-neutral-400">{description}</p>
                </article>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-neutral-950 px-6 py-6 text-white dark:bg-neutral-900 sm:px-8">
              <div><p className="text-lg font-semibold">Ready to make practice count?</p><p className="mt-1 text-sm text-neutral-400">Create your account and start with your resume.</p></div>
              <Link to="/register" className="btn rounded-xl bg-white px-5 text-neutral-950 hover:bg-neutral-200">Get started <ArrowRight size={16} /></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-slate-500 dark:text-neutral-500 sm:px-8">
        <span>InterviewPath · Personalized practice, real progress.</span>
        <span>AI-powered interview preparation</span>
      </footer>
    </div>
  );
}
