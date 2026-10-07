import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { profileSchema } from '../validators/profileSchema';
import FormField from '../components/FormField';

const toForm = (u) => ({
  name: u.name || '', phone: u.phone || '', domain: u.domain || '', targetRole: u.targetRole || '',
  preferredIndustry: u.preferredIndustry || '', skills: (u.skills || []).join(', '),
  education: u.education || [], experience: u.experience || [],
  linkedinUrl: u.linkedinUrl || '', githubUrl: u.githubUrl || '', portfolioUrl: u.portfolioUrl || '',
});

export default function Profile() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(profileSchema), defaultValues: toForm(user) });
  const edu = useFieldArray({ control, name: 'education' });
  const exp = useFieldArray({ control, name: 'experience' });

  useEffect(() => {
    api.get('/users/profile')
      .then((r) => reset(toForm(r.data.data.user)))
      .catch((e) => setLoadError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (v) => {
    const payload = { ...v, skills: (v.skills || '').split(',').map((s) => s.trim()).filter(Boolean) };
    try {
      const { data } = await api.put('/users/profile', payload);
      setUser(data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <div className="card h-64 animate-pulse" />;
  if (loadError) return <div className="card text-red-500">{loadError}</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <section className="card grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" error={errors.name}><input className="input" {...register('name')} /></FormField>
        <div><label className="label">Email</label><input className="input opacity-60" value={user.email} disabled readOnly /></div>
        <FormField label="Phone" error={errors.phone}><input className="input" {...register('phone')} /></FormField>
        <FormField label="Domain" error={errors.domain}><input className="input" placeholder="e.g. Data Analytics" {...register('domain')} /></FormField>
        <FormField label="Target job role" error={errors.targetRole}><input className="input" {...register('targetRole')} /></FormField>
        <FormField label="Preferred industry" error={errors.preferredIndustry}><input className="input" {...register('preferredIndustry')} /></FormField>
        <div className="sm:col-span-2">
          <FormField label="Skills (comma separated)" error={errors.skills}><input className="input" placeholder="Python, SQL, Power BI" {...register('skills')} /></FormField>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Education</h2>
          <button type="button" className="btn-ghost" onClick={() => edu.append({ degree: '', institution: '', year: '' })}><Plus size={16} /> Add</button>
        </div>
        {edu.fields.length === 0 && <p className="text-sm text-slate-500">No education added yet.</p>}
        {edu.fields.map((f, i) => (
          <div key={f.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_100px_auto]">
            <input className="input" placeholder="Degree" {...register(`education.${i}.degree`)} />
            <input className="input" placeholder="Institution" {...register(`education.${i}.institution`)} />
            <input className="input" placeholder="Year" {...register(`education.${i}.year`)} />
            <button type="button" className="btn-ghost text-red-500" onClick={() => edu.remove(i)} aria-label="Remove"><Trash2 size={16} /></button>
          </div>
        ))}
      </section>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Experience</h2>
          <button type="button" className="btn-ghost" onClick={() => exp.append({ title: '', company: '', duration: '' })}><Plus size={16} /> Add</button>
        </div>
        {exp.fields.length === 0 && <p className="text-sm text-slate-500">No experience added yet.</p>}
        {exp.fields.map((f, i) => (
          <div key={f.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_140px_auto]">
            <input className="input" placeholder="Title" {...register(`experience.${i}.title`)} />
            <input className="input" placeholder="Company" {...register(`experience.${i}.company`)} />
            <input className="input" placeholder="Duration" {...register(`experience.${i}.duration`)} />
            <button type="button" className="btn-ghost text-red-500" onClick={() => exp.remove(i)} aria-label="Remove"><Trash2 size={16} /></button>
          </div>
        ))}
      </section>

      <section className="card grid gap-4 sm:grid-cols-2">
        <FormField label="LinkedIn URL" error={errors.linkedinUrl}><input className="input" {...register('linkedinUrl')} /></FormField>
        <FormField label="GitHub URL" error={errors.githubUrl}><input className="input" {...register('githubUrl')} /></FormField>
        <FormField label="Portfolio URL" error={errors.portfolioUrl}><input className="input" {...register('portfolioUrl')} /></FormField>
      </section>

      <button className="btn" disabled={isSubmitting}>{isSubmitting && <Loader2 size={16} className="animate-spin" />} Save changes</button>
    </form>
  );
}
