import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { KeyRound } from 'lucide-react';
import { usersApi } from '../../api/users.api.js';
import { updateUser } from '../../store/slices/authSlice.js';

export function ForcePasswordChangeModal() {
  const dispatch = useDispatch();
  const mustChangePassword = useSelector((s) => s.auth.user?.mustChangePassword);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!mustChangePassword) return null;

  const submit = async () => {
    setError('');
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await usersApi.changeOwnPassword({ currentPassword, newPassword });
      dispatch(updateUser({ mustChangePassword: false }));
    } catch (err) {
      setError(err?.error || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
      <div className="bg-[#111318] border border-[#2A2F45] rounded-2xl p-6 w-96 shadow-2xl">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound className="w-5 h-5 text-indigo-400" />
          <h3 className="text-slate-100 font-semibold text-lg">Set a new password</h3>
        </div>
        <p className="text-slate-400 text-sm mb-5">
          Your account was created with a temporary password. Choose a new one before continuing.
        </p>

        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Temporary password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">New password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Confirm new password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-[#1A1D26] border border-[#2A2F45] rounded-lg px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button onClick={submit} disabled={!currentPassword || !newPassword || submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-all">
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </div>
  );
}

export default ForcePasswordChangeModal;
