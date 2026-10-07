import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, BrainCircuit, Check, Loader2, Moon, Sparkles, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getErrorMessage } from '../services/api';
import { loginSchema, registerSchema } from '../validators/authSchemas';
import FormField from '../components/FormField';

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login';
  const { user, login, register: registerUser } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(isLogin ? loginSchema : registerSchema) });

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (values) => {
    try {
      await (isLogin ? login(values) : registerUser(values));
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 text-slate-950 dark:bg-black dark:text-neutral-100 sm:px-6">
      <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-500/15" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative w-full max-w-5xl">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><BrainCircuit size={20} /></span>
            <span>Interview<span className="text-brand-600">Path</span></span>
          </Link>
          <button className="btn-ghost rounded-full border border-slate-200 bg-white/70 dark:border-neutral-800 dark:bg-neutral-950/70" onClick={toggle} aria-label="Toggle theme">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-black/30 md:grid-cols-[0.9fr_1.1fr]">
          <section className="relative hidden flex-col justify-between overflow-hidden bg-neutral-950 p-9 text-white dark:bg-neutral-900 md:flex lg:p-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-600/30 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300">
                <Sparkles size={14} className="text-violet-300" /> Your next step starts here
              </div>
              <h1 className="mt-8 text-3xl font-bold leading-tight lg:text-4xl">
                Get ready to show what you can do.
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-400">
                Practice with questions shaped around your resume, then use focused feedback to keep getting better.
              </p>
            </div>
            <div className="relative mt-12 space-y-3 text-sm text-neutral-300">
              <p className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Practice built around your experience</p>
              <p className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Feedback that helps you improve</p>
              <p className="flex items-center gap-2"><Check size={16} className="text-emerald-400" /> Progress you can track</p>
            </div>
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-16 -right-8 h-44 w-44 rounded-full border border-white/10" />
          </section>

          <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
            <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md space-y-5">
              <div className="mb-7">
                <p className="text-sm font-semibold text-brand-600">{isLogin ? 'WELCOME BACK' : 'GET STARTED'}</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">{isLogin ? 'Sign in to your account' : 'Create your account'}</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-neutral-400">
                  {isLogin ? 'Pick up where your interview preparation left off.' : 'Create an account and start preparing at your pace.'}
                </p>
              </div>
              {!isLogin && <FormField label="Full name" error={errors.name}><input autoComplete="name" className="input" {...register('name')} /></FormField>}
              <FormField label="Email" error={errors.email}><input type="email" autoComplete="email" className="input" {...register('email')} /></FormField>
              <FormField label="Password" error={errors.password}><input type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} className="input" {...register('password')} /></FormField>
              <button className="btn w-full justify-center rounded-xl py-2.5 shadow-md shadow-brand-600/15" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Please wait...</> : <>{isLogin ? 'Sign in' : 'Create account'} <ArrowRight size={16} /></>}
              </button>
              <p className="pt-1 text-center text-sm text-slate-500 dark:text-neutral-400">
                {isLogin ? "Don't have an account? " : 'Already registered? '}
                <Link className="font-semibold text-brand-600 hover:underline dark:text-brand-400" to={isLogin ? '/register' : '/login'}>{isLogin ? 'Create one' : 'Sign in'}</Link>
              </p>
            </form>
          </section>
        </div>
        <p className="mt-5 text-center text-xs text-slate-500 dark:text-neutral-600">Personalized interview practice, one step at a time.</p>
      </div>
    </div>
  );
}
