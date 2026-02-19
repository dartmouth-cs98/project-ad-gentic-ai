import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import {
  SparklesIcon,
  Loader2Icon,
  CheckCircleIcon
} from
  'lucide-react';
import { signIn } from '../utils/auth';
export function SignInPage() {
  const navigate = useNavigate();
  const [rememberedUser, setRememberedUser] = useState<{
    name: string;
    email: string;
  } | null>(null);
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
  // Check for previously signed-in user
  useEffect(() => {
    const lastEmail = localStorage.getItem('adgentic_last_email');
    const lastName = localStorage.getItem('adgentic_last_name');
    if (lastEmail && lastName) {
      setRememberedUser({
        name: lastName,
        email: lastEmail
      });
      setForm((prev) => ({
        ...prev,
        email: lastEmail
      }));
    }
  }, []);
  const clearRememberedUser = () => {
    localStorage.removeItem('adgentic_last_email');
    localStorage.removeItem('adgentic_last_name');
    setRememberedUser(null);
    setForm({
      email: '',
      password: ''
    });
  };
  const handleGoogleSignIn = () => {
    setAuthState('loading');
    setLoadingMessage('Signing you in with Google...');
    setTimeout(() => {
      // Save user for "remember me"
      localStorage.setItem('adgentic_last_email', 'alex@acme.inc');
      localStorage.setItem('adgentic_last_name', 'Alex Johnson');
      localStorage.setItem('adgentic_auth_flow', 'signin');
      setAuthState('success');
      setLoadingMessage('Welcome back! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }, 1500);
  };
  const handleSubmit = (e: React.FormEvent) => {
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
    setTimeout(() => {
      const result = signIn(form.email, form.password);
      if (!result.success) {
        setAuthState('idle');
        setAuthError(result.error || 'Sign in failed');
        return;
      }
      // Save user for "remember me"
      localStorage.setItem('adgentic_last_email', form.email);
      localStorage.setItem('adgentic_last_name', 'Alex Johnson');
      localStorage.setItem('adgentic_auth_flow', 'signin');
      setAuthState('success');
      setLoadingMessage('Welcome back! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }, 1000);
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
          {authState === 'success' ?
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Success!
              </h2>
              <p className="text-slate-500">{loadingMessage}</p>
            </div> :

            <>
              {rememberedUser ?
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-semibold mx-auto mb-3">
                    {rememberedUser.name.charAt(0)}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    Welcome back, {rememberedUser.name.split(' ')[0]}
                  </h1>
                  <p className="text-slate-500 text-sm">
                    {rememberedUser.email}
                  </p>
                  <button
                    onClick={clearRememberedUser}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-1">

                    Not you? Use a different account
                  </button>
                </div> :

                <>
                  <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                    Welcome back
                  </h1>
                  <p className="text-slate-500 text-center mb-6">
                    Sign in to your Ad-gentic AI account
                  </p>
                </>
              }

              {authError &&
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {authError}
                </div>
              }

              <Button
                variant="secondary"
                className="w-full mb-6"
                onClick={handleGoogleSignIn}
                disabled={authState === 'loading'}
                leftIcon={
                  authState === 'loading' ?
                    <Loader2Icon className="w-5 h-5 animate-spin text-slate-500" /> :

                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />

                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />

                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />

                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />

                    </svg>

                }>

                {authState === 'loading' ?
                  'Signing in...' :
                  'Continue with Google'}
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">or</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!rememberedUser &&
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
                    disabled={authState === 'loading'} />

                }
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
                    disabled={authState === 'loading'} />

                  <div className="mt-1 text-right">
                    <a
                      href="#"
                      className="text-sm text-blue-600 hover:text-blue-700">

                      Forgot password?
                    </a>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={authState === 'loading'}>

                  {authState === 'loading' ?
                    <>
                      <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                      Signing In...
                    </> :

                    'Sign In'
                  }
                </Button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Don't have an account?{' '}
                <Link
                  to="/sign-up"
                  className="text-blue-600 hover:text-blue-700 font-medium">

                  Sign up
                </Link>
              </p>
            </>
          }
        </Card>
      </div>
    </div>);

}