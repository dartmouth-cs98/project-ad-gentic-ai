import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import {
  SparklesIcon,
  CheckIcon,
  Loader2Icon,
  CheckCircleIcon,
  ShieldCheckIcon } from
'lucide-react';
import { signUp } from '../utils/auth';
function getPasswordStrength(password: string): {
  level: number;
  label: string;
  color: string;
} {
  if (!password)
  return {
    level: 0,
    label: '',
    color: ''
  };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1)
  return {
    level: 1,
    label: 'Weak',
    color: 'bg-red-500'
  };
  if (score <= 2)
  return {
    level: 2,
    label: 'Fair',
    color: 'bg-orange-500'
  };
  if (score <= 3)
  return {
    level: 3,
    label: 'Good',
    color: 'bg-yellow-500'
  };
  if (score <= 4)
  return {
    level: 4,
    label: 'Strong',
    color: 'bg-emerald-500'
  };
  return {
    level: 5,
    label: 'Excellent',
    color: 'bg-emerald-600'
  };
}
export function SignUpPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'plan'>('form');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    'monthly'
  );
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState('');
  const [authState, setAuthState] = useState<'idle' | 'loading' | 'success'>(
    'idle'
  );
  const [loadingMessage, setLoadingMessage] = useState('');
  const passwordStrength = getPasswordStrength(form.password);
  const handleGoogleSignUp = () => {
    setAuthState('loading');
    setLoadingMessage('Creating your account...');
    // Simulate Google Sign Up
    setTimeout(() => {
      const dummyEmail = `google-user-${Date.now()}@gmail.com`;
      signUp(dummyEmail, 'password123'); // Create dummy account
      setAuthState('success');
      setLoadingMessage('Account created! Let us pick your plan...');
      setTimeout(() => {
        setAuthState('idle'); // Reset for plan selection view
        setStep('plan');
      }, 3000);
    }, 1500);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const newErrors: Record<string, string> = {};
    if (!form.email) newErrors.email = 'Email is required';else
    if (!/\S+@\S+\.\S+/.test(form.email))
    newErrors.email = 'Invalid email format';
    if (!form.password) newErrors.password = 'Password is required';else
    if (form.password.length < 8)
    newErrors.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword)
    newErrors.confirmPassword = 'Passwords do not match';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setAuthState('loading');
    setLoadingMessage('Creating your account...');
    setTimeout(() => {
      const result = signUp(form.email, form.password);
      if (!result.success) {
        setAuthState('idle');
        setAuthError(result.error || 'Sign up failed');
        return;
      }
      setAuthState('success');
      setLoadingMessage('Account created!');
      setTimeout(() => {
        setAuthState('idle');
        setStep('plan');
      }, 3000);
    }, 1000);
  };
  const handlePlanSelect = (plan: string) => {
    // In real app, would save plan selection
    localStorage.setItem('adgentic_auth_flow', 'signup');
    navigate('/onboarding');
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

        {step === 'form' ?
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
                <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                  Create your account
                </h1>
                <p className="text-slate-500 text-center mb-8">
                  Start generating high-converting ads today
                </p>

                {authError &&
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    {authError}
                  </div>
            }

                <Button
              variant="secondary"
              className="w-full mb-6"
              onClick={handleGoogleSignUp}
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
              'Creating account...' :
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

                  <div>
                    <Input
                  label="Password"
                  type="password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value
                  })
                  }
                  error={errors.password}
                  disabled={authState === 'loading'} />

                    {form.password &&
                <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((i) =>
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= passwordStrength.level ? passwordStrength.color : 'bg-slate-200'}`} />

                    )}
                        </div>
                        <p
                    className={`text-xs ${passwordStrength.level <= 1 ? 'text-red-500' : passwordStrength.level <= 2 ? 'text-orange-500' : passwordStrength.level <= 3 ? 'text-yellow-600' : 'text-emerald-600'}`}>

                          {passwordStrength.label}
                          {passwordStrength.level <= 2 &&
                    ' — try adding numbers or symbols'}
                        </p>
                      </div>
                }
                    {!form.password &&
                <p className="text-xs text-slate-400 mt-1">
                        Must be at least 8 characters
                      </p>
                }
                  </div>
                  <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={(e) =>
                setForm({
                  ...form,
                  confirmPassword: e.target.value
                })
                }
                error={errors.confirmPassword}
                disabled={authState === 'loading'} />


                  <p className="text-xs text-slate-400 text-center leading-relaxed">
                    By creating an account, you agree to our{' '}
                    <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 underline">

                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 underline">

                      Privacy Policy
                    </a>
                    .
                  </p>

                  <Button
                type="submit"
                className="w-full"
                disabled={authState === 'loading'}>

                    {authState === 'loading' ?
                <>
                        <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </> :

                'Create Account'
                }
                  </Button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-6">
                  Already have an account?{' '}
                  <Link
                to="/sign-in"
                className="text-blue-600 hover:text-blue-700 font-medium">

                    Sign in
                  </Link>
                </p>
              </>
          }
          </Card> :

        <div className="space-y-5">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Choose your plan
              </h1>
              <p className="text-slate-500">
                Start with a free trial, upgrade anytime
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <span
              className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>

                Monthly
              </span>
              <button
              onClick={() =>
              setBillingCycle(
                billingCycle === 'monthly' ? 'annual' : 'monthly'
              )
              }
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${billingCycle === 'annual' ? 'bg-blue-600' : 'bg-slate-300'}`}>

                <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'}`} />

              </button>
              <span
              className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-slate-900' : 'text-slate-400'}`}>

                Annual
              </span>
              {billingCycle === 'annual' &&
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  Save 20%
                </span>
            }
            </div>

            {/* Basic */}
            <Card
            variant="elevated"
            padding="md"
            className="cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all"
            onClick={() => handlePlanSelect('basic')}>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">
                    Basic
                  </h3>
                  <p className="text-slate-500 text-sm">Free forever</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">$0</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckIcon className="w-4 h-4 text-emerald-500" />3 campaigns,
                  20 chats/month
                </li>
              </ul>
            </Card>

            {/* Premium - Highlighted */}
            <Card
            variant="elevated"
            padding="md"
            className="ring-2 ring-blue-500 cursor-pointer hover:ring-blue-400 transition-all relative"
            onClick={() => handlePlanSelect('premium')}>

              <div className="absolute -top-3 left-4 px-2.5 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full shadow-sm">
                Most popular for growing teams
              </div>
              <div className="flex items-center justify-between mt-1">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">
                    Premium
                  </h3>
                  <p className="text-slate-500 text-sm">14-day free trial</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">
                    {billingCycle === 'annual' ? '$79' : '$99'}
                    <span className="text-sm font-normal text-slate-500">
                      /mo
                    </span>
                  </p>
                  {billingCycle === 'annual' &&
                <p className="text-xs text-slate-400 line-through">
                      $99/mo
                    </p>
                }
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckIcon className="w-4 h-4 text-emerald-500" />
                  Unlimited everything + automated posting
                </li>
              </ul>
            </Card>

            {/* Enterprise */}
            <Card
            variant="elevated"
            padding="md"
            className="cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all"
            onClick={() => handlePlanSelect('enterprise')}>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">
                    Enterprise
                  </h3>
                  <p className="text-slate-500 text-sm">Custom pricing</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">Custom</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckIcon className="w-4 h-4 text-emerald-500" />
                  Dedicated support + custom integrations
                </li>
              </ul>
            </Card>

            <button
            onClick={() => handlePlanSelect('basic')}
            className="w-full text-center text-slate-400 hover:text-slate-600 text-sm transition-colors">

              Skip — use free plan
            </button>
          </div>
        }
      </div>
    </div>);

}