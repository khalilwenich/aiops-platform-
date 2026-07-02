import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Save, Upload, Eye, EyeOff, Lock, Bell, BellOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../api/users.api.js';
import { pipelinesApi } from '../../api/pipelines.api.js';
import { updateUser } from '../../store/slices/authSlice.js';

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-[#111318] border border-[#1E2130] rounded-xl p-6 mb-4">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
      </div>
      <div className="border-t border-[#1E2130] pt-5">{children}</div>
    </div>
  );
}

function InputField({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-1.5">{label}</label>
      <input
        className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5
          text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500
          focus:ring-1 focus:ring-indigo-500 transition-all duration-200 text-sm"
        {...props}
      />
    </div>
  );
}

function PasswordField({ label, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5 pr-10
            text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500
            focus:ring-1 focus:ring-indigo-500 transition-all duration-200 text-sm"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function SaveButton({ onClick, loading, children }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60
        text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200"
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : <Save className="w-4 h-4" />
      }
      {children}
    </button>
  );
}

function getStrength(pwd) {
  if (!pwd) return null;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNum = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  if (pwd.length > 10 && hasUpper && hasNum && hasSpecial) return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
  if (pwd.length >= 8) return { label: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
  if (pwd.length >= 6) return { label: 'Fair', color: 'bg-amber-500', width: 'w-2/4' };
  return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
}

export default function ProfileSettings({ onToast }) {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [prefs, setPrefs] = useState({ language: 'Français', timezone: 'Africa/Tunis', dateFormat: 'DD/MM/YYYY', theme: 'Dark' });
  const [subscribedProjects, setSubscribedProjects] = useState([]);
  const [slackWebhook, setSlackWebhook] = useState('');
  const [loading, setLoading] = useState({ profile: false, password: false, prefs: false, surveillance: false });

  const { data: projectsData } = useQuery({
    queryKey: ['pipelines', 'projects'],
    queryFn: pipelinesApi.getProjects,
    staleTime: 60_000,
  });
  const availableProjects = projectsData?.projects || [];

  useEffect(() => {
    usersApi.getProfile()
      .then(({ user }) => {
        setProfile({ name: user.name || '', title: user.title || '', department: user.department || '', phone: user.phone || '', email: user.email });
        if (user.preferences) setPrefs(user.preferences);
        setSubscribedProjects(user.subscribedProjects || []);
        setSlackWebhook(user.slackWebhook || '');
      })
      .catch(() => onToast('Failed to load profile', 'error'));
  }, [onToast]);

  if (!profile) {
    return <div className="text-slate-500 text-sm">Loading profile…</div>;
  }

  const saveProfile = async () => {
    setLoading(l => ({ ...l, profile: true }));
    try {
      const { user } = await usersApi.updateProfile({ name: profile.name, title: profile.title, department: profile.department, phone: profile.phone });
      dispatch(updateUser({ name: user.name }));
      onToast('Changes saved successfully', 'success');
    } catch (err) {
      onToast(err?.error || 'Failed to save changes', 'error');
    } finally {
      setLoading(l => ({ ...l, profile: false }));
    }
  };

  const savePassword = async () => {
    if (!passwords.current || !passwords.next) {
      onToast('Fill in both password fields', 'error');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      onToast('Passwords do not match', 'error');
      return;
    }
    setLoading(l => ({ ...l, password: true }));
    try {
      await usersApi.changeOwnPassword({ currentPassword: passwords.current, newPassword: passwords.next });
      setPasswords({ current: '', next: '', confirm: '' });
      onToast('Password updated', 'success');
    } catch (err) {
      onToast(err?.error || 'Failed to update password', 'error');
    } finally {
      setLoading(l => ({ ...l, password: false }));
    }
  };

  const savePrefs = async () => {
    setLoading(l => ({ ...l, prefs: true }));
    try {
      await usersApi.updateProfile({ preferences: prefs });
      onToast('Preferences saved', 'success');
    } catch (err) {
      onToast(err?.error || 'Failed to save preferences', 'error');
    } finally {
      setLoading(l => ({ ...l, prefs: false }));
    }
  };

  const toggleProject = (projectId) => {
    setSubscribedProjects(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  };

  const saveSurveillance = async () => {
    setLoading(l => ({ ...l, surveillance: true }));
    try {
      await usersApi.updateProfile({ subscribedProjects, slackWebhook });
      dispatch(updateUser({ subscribedProjects, slackWebhook }));
      onToast('Surveillance settings saved', 'success');
    } catch (err) {
      onToast(err?.error || 'Failed to save surveillance settings', 'error');
    } finally {
      setLoading(l => ({ ...l, surveillance: false }));
    }
  };

  const strength = getStrength(passwords.next);
  const mismatch = passwords.confirm && passwords.next !== passwords.confirm;
  const initials = (profile.name || profile.email || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div>
      {/* Avatar card */}
      <SectionCard title="My Account" subtitle="Manage your profile and avatar">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600
            flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-100">{profile.name || profile.email}</p>
            <span className="bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded text-xs font-medium">{profile.title || 'Member'}</span>
            <div className="mt-3">
              <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200
                border border-[#2A2F45] hover:border-[#3A3F55] rounded-lg px-3 py-1.5 transition-all">
                <Upload className="w-3.5 h-3.5" /> Change Avatar
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Personal info */}
      <SectionCard title="Personal Information" subtitle="Update your personal details">
        <div className="grid grid-cols-2 gap-4 mb-5">
          <InputField label="Full Name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
            <div className="relative">
              <input readOnly value={profile.email}
                className="w-full bg-[#1A1D26]/50 border border-[#2A2F45] rounded-lg px-4 py-2.5 pr-10
                  text-slate-500 text-sm cursor-not-allowed" />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
            </div>
          </div>
          <InputField label="Job Title" placeholder="DevOps Engineer" value={profile.title}
            onChange={e => setProfile(p => ({ ...p, title: e.target.value }))} />
          <InputField label="Department" placeholder="Engineering" value={profile.department}
            onChange={e => setProfile(p => ({ ...p, department: e.target.value }))} />
          <InputField label="Phone (optional)" placeholder="+216 XX XXX XXX" value={profile.phone}
            onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
        </div>
        <SaveButton onClick={saveProfile} loading={loading.profile}>Save Changes</SaveButton>
      </SectionCard>

      {/* Change password */}
      <SectionCard title="Change Password" subtitle="Keep your account secure">
        <div className="flex flex-col gap-4 max-w-md mb-5">
          <PasswordField label="Current Password" value={passwords.current}
            onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} />
          <div>
            <PasswordField label="New Password" value={passwords.next}
              onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))} />
            {strength && (
              <div className="mt-2">
                <div className="h-1.5 bg-[#1A1D26] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                </div>
                <p className={`text-xs mt-1 ${strength.label === 'Strong' ? 'text-emerald-400' : strength.label === 'Good' ? 'text-blue-400' : strength.label === 'Fair' ? 'text-amber-400' : 'text-red-400'}`}>
                  {strength.label}
                </p>
              </div>
            )}
          </div>
          <div>
            <PasswordField label="Confirm Password" value={passwords.confirm}
              onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
            {mismatch && <p className="text-xs text-red-400 mt-1">Passwords do not match</p>}
          </div>
        </div>
        <SaveButton onClick={savePassword} loading={loading.password}>Update Password</SaveButton>
      </SectionCard>

      {/* Preferences */}
      <SectionCard title="Preferences" subtitle="Customize your experience">
        <div className="grid grid-cols-2 gap-4 mb-5">
          {[
            { label: 'Language', key: 'language', options: ['Français', 'English'] },
            { label: 'Timezone', key: 'timezone', options: ['Africa/Tunis', 'UTC', 'Europe/Paris', 'America/New_York'] },
            { label: 'Date Format', key: 'dateFormat', options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] },
            { label: 'Theme', key: 'theme', options: ['Dark', 'System'] },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">{label}</label>
              <select
                value={prefs[key]}
                onChange={e => setPrefs(p => ({ ...p, [key]: e.target.value }))}
                className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5
                  text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1
                  focus:ring-indigo-500 transition-all duration-200 text-sm"
              >
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <SaveButton onClick={savePrefs} loading={loading.prefs}>Save Preferences</SaveButton>
      </SectionCard>

      {/* Surveillance */}
      <SectionCard title="Surveillance des projets" subtitle="Abonnez-vous aux projets que vous souhaitez surveiller">
        <div className="mb-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Projets disponibles</p>
          {availableProjects.length === 0 ? (
            <p className="text-slate-500 text-sm italic">Aucun projet trouvé dans la base de données.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {availableProjects.map(p => {
                const subscribed = subscribedProjects.includes(p.projectId);
                return (
                  <button
                    key={p.projectId}
                    onClick={() => toggleProject(p.projectId)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm text-left transition-all
                      ${subscribed
                        ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300'
                        : 'bg-[#1A1D26] border-[#2A2F45] text-slate-400 hover:border-[#3A3F55]'}`}
                  >
                    {subscribed
                      ? <Bell className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      : <BellOff className="w-4 h-4 text-slate-600 flex-shrink-0" />}
                    <span className="truncate">{p.projectName || p.projectId}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-5">
          <InputField
            label="Slack Webhook URL (optionnel)"
            placeholder="https://hooks.slack.com/services/..."
            value={slackWebhook}
            onChange={e => setSlackWebhook(e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Recevez une notification Slack lors d'une défaillance sur vos projets abonnés.
          </p>
        </div>

        <SaveButton onClick={saveSurveillance} loading={loading.surveillance}>Enregistrer</SaveButton>
      </SectionCard>
    </div>
  );
}
