import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Loader2Icon, CheckCircleIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { useSignIn } from '../hooks/useAuth';
import { resendVerification } from '../api/auth';

export function SignInPage() {
  const navigate = useNavigate();
  const signInMutation = useSignIn();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState('');
  const [authState, setAuthState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');

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
      onError: (err: unknown) => {
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
                {authError.toLowerCase().includes('not verified') && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const email = form.email.trim();
                        const query = email ? `?email=${encodeURIComponent(email)}` : '';
                        navigate(`/verify-email${query}`);
                      }}
                      className="mt-3 w-full py-2 border border-red-500/30 rounded-lg text-xs font-medium hover:bg-red-500/10 transition-colors"
                    >
                      Enter verification code
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!form.email) return;
                        setResendState('loading');
                        setResendMessage('');
                        try {
                          const res = await resendVerification(form.email.trim());
                          setResendState('success');
                          setResendMessage(res.message);
                        } catch (err) {
                          setResendState('error');
                          setResendMessage(err instanceof Error ? err.message : 'Failed to resend verification email.');
                        }
                      }}
                      disabled={resendState === 'loading'}
                      className="mt-2 w-full py-2 border border-red-500/30 rounded-lg text-xs font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
                    >
                      {resendState === 'loading' ? 'Sending...' : 'Resend verification code'}
                    </button>
                  </>
                )}
                {resendMessage && (
                  <p className="mt-2 text-xs text-red-500">{resendMessage}</p>
                )}
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
                  <Link to="/reset-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    disabled={authState === 'loading'}
                    className="w-full px-3 py-2 pr-10 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
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
