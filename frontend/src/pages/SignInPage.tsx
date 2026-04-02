import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Loader2Icon, CheckCircleIcon } from 'lucide-react';
import { useSignIn } from '../hooks/useAuth';

export function SignInPage() {
  const navigate = useNavigate();
  const signInMutation = useSignIn();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState('');
  const [authState, setAuthState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const newErrors: Record<string, string> = {};
    if (!form.email) newErrors.email = 'Email is required';
    if (!form.password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setAuthState('loading');
    setLoadingMessage('Signing you in...');

    signInMutation.mutate({ email: form.email, password: form.password }, {
      onSuccess: () => {
        setAuthState('success');
        setLoadingMessage('Redirecting to dashboard...');
        setTimeout(() => { navigate('/dashboard'); }, 1000);
      },
      onError: (err: any) => {
        setAuthState('idle');
        setAuthError(err instanceof Error ? err.message : 'Sign in failed');
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex justify-center mb-8">
          <Logo size="md" />
        </Link>

        {authState === 'success' ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-7 h-7 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Signed in</h2>
            <p className="text-sm text-muted-foreground">{loadingMessage}</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8">
            <h1 className="text-xl font-semibold text-center mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Enter your credentials to access your account
            </p>

            {authError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                {authError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={authState === 'loading'}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 disabled:opacity-50"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium">Password</label>
                  <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={authState === 'loading'}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 disabled:opacity-50"
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={authState === 'loading'}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {authState === 'loading' ? (
                  <><Loader2Icon className="w-4 h-4 animate-spin" /> Signing In...</>
                ) : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{' '}
              <Link to="/sign-up" className="text-foreground font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
