import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Zap, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client.js';
import { setCredentials } from '../store/slices/authSlice.js';
import { Button } from '../components/ui/Button.jsx';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.post('/api/auth/login', { email, password });
      dispatch(setCredentials({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }));
      navigate('/dashboard');
    } catch (err) {
      setError(err.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-indigo-600/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
            <Zap className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-2">AIOps Platform</h1>
          <p className="text-sm text-text-muted">Intelligent Pipeline Observability</p>
        </div>

        {/* Form */}
        <div className="bg-surface border border-border rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@company.com"
                className="w-full bg-surface-2 border border-border-2 focus:border-primary rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-2 border border-border-2 focus:border-primary rounded-lg px-4 py-3 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-danger text-sm bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
