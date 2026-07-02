import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Plus, X, Copy, KeyRound, UserX, UserCheck } from 'lucide-react';
import { usersApi } from '../../api/users.api.js';

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

const ROLES = ['admin', 'analyst', 'security', 'viewer'];

function TempPasswordModal({ email, tempPassword, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(tempPassword).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#111318] border border-[#2A2F45] rounded-2xl p-6 w-96 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-slate-100 font-semibold text-lg">Temporary password</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-slate-400 text-sm mb-3">
          Share this with <span className="text-slate-200">{email}</span> through a secure channel (Teams, email).
          They will be asked to change it on first login.
        </p>
        <div className="bg-[#1A1D26] border border-[#2A2F45] rounded-lg p-3 font-mono text-sm text-indigo-300 break-all mb-2">
          {tempPassword}
        </div>
        <button
          onClick={copy}
          className="w-full flex items-center justify-center gap-2 border border-[#2A2F45] hover:border-[#3A3F55] text-slate-300 text-sm py-2 rounded-lg transition-all mb-3"
        >
          <Copy className="w-3.5 h-3.5" />{copied ? 'Copied!' : 'Copy password'}
        </button>
        <p className="text-amber-400 text-xs text-center">⚠️ This won't be shown again.</p>
      </div>
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('viewer');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const { user, tempPassword } = await usersApi.create({ email, name, role });
      onCreated(user, tempPassword);
    } catch (err) {
      setError(err?.error || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[#111318] border border-[#2A2F45] rounded-2xl p-6 w-96 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-slate-100 font-semibold text-lg">Add User</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe"
              className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Work email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane.doe@capgemini.com" type="email"
              className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button onClick={submit} disabled={!email || !name || submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-all">
          {submitting ? 'Creating…' : 'Create user'}
        </button>
      </div>
    </div>
  );
}

export default function UserManagement({ onToast }) {
  const currentUserId = useSelector((s) => s.auth.user?.id);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [tempPasswordInfo, setTempPasswordInfo] = useState(null); // { email, tempPassword }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { users } = await usersApi.getAll();
      setUsers(users);
    } catch {
      onToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => { load(); }, [load]);

  const handleCreated = (user, tempPassword) => {
    setShowCreate(false);
    setTempPasswordInfo({ email: user.email, tempPassword });
    onToast(`User ${user.email} created`, 'success');
    load();
  };

  const handleRoleChange = async (user, role) => {
    try {
      await usersApi.update(user._id, { role });
      onToast(`Role updated for ${user.email}`, 'success');
      load();
    } catch (err) {
      onToast(err?.error || 'Failed to update role', 'error');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await usersApi.update(user._id, { isActive: !user.isActive });
      onToast(`${user.email} ${user.isActive ? 'deactivated' : 'reactivated'}`, 'success');
      load();
    } catch (err) {
      onToast(err?.error || 'Failed to update user', 'error');
    }
  };

  const handleResetPassword = async (user) => {
    try {
      const { tempPassword } = await usersApi.resetPassword(user._id);
      setTempPasswordInfo({ email: user.email, tempPassword });
    } catch (err) {
      onToast(err?.error || 'Failed to reset password', 'error');
    }
  };

  return (
    <div>
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {tempPasswordInfo && (
        <TempPasswordModal email={tempPasswordInfo.email} tempPassword={tempPasswordInfo.tempPassword} onClose={() => setTempPasswordInfo(null)} />
      )}

      <SectionCard title="Team Members" subtitle="Manage who can access the AIOps platform and with which role">
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-all">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#1E2130]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E2130]">
                  {['Name', 'Email', 'Role', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 text-xs font-medium uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-[#1E2130] last:border-0">
                    <td className="px-4 py-3 text-slate-200">{u.name}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <select value={u.role} onChange={(e) => handleRoleChange(u, e.target.value)}
                        className="bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-indigo-500">
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${u.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {u.isActive ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleResetPassword(u)} title="Reset password"
                          className="text-slate-500 hover:text-slate-300 transition-colors"><KeyRound className="w-4 h-4" /></button>
                        <button onClick={() => handleToggleActive(u)} disabled={u._id === currentUserId} title={u.isActive ? 'Deactivate' : 'Reactivate'}
                          className={`transition-colors ${u._id === currentUserId ? 'opacity-30 cursor-not-allowed text-slate-600' : u.isActive ? 'text-red-500/60 hover:text-red-400' : 'text-emerald-500/60 hover:text-emerald-400'}`}>
                          {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
