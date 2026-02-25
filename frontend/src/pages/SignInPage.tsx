import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import {
  SparklesIcon,
  Loader2Icon,
  CheckCircleIcon
} from 'lucide-react';
import { useSignIn } from '../hooks/useAuth';

export function SignInPage() {
  const navigate = useNavigate();
  const signInMutation = useSignIn();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState('');
  const [authState, setAuthState] = useState<'idle' | 'loading' | 'success'>(
    'idle'
  );
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

    signInMutation.mutate({
      email: form.email,
      password: form.password
    }, {
      onSuccess: () => {
        setAuthState('success');
        setLoadingMessage('Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      },
      onError: (err: any) => {
        setAuthState('idle');
        setAuthError(err instanceof Error ? err.message : 'Sign in failed');
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-xl text-slate-900">
            Ad-gentic AI
          </span>
        </Link>

        <Card variant="elevated" padding="lg">
          {authState === 'success' ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Success!
              </h2>
              <p className="text-slate-500">{loadingMessage}</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                Sign In
              </h1>
              <p className="text-slate-500 text-center mb-6">
                Enter your credentials to access your account
              </p>

              {authError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {authError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value
                    })
                  }
                  error={errors.email}
                  disabled={authState === 'loading'}
                />

                <div>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        password: e.target.value
                      })
                    }
                    error={errors.password}
                    disabled={authState === 'loading'}
                  />
                  <div className="mt-1 text-right">
                    <a
                      href="#"
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Forgot password?
                    </a>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={authState === 'loading'}
                >
                  {authState === 'loading' ? (
                    <>
                      <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Don't have an account?{' '}
                <Link
                  to="/sign-up"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign up
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}