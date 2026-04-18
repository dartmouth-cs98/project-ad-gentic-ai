import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Logo } from '../components/ui/Logo';
import { Loader2Icon, CheckCircleIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { signUp, resendVerification, verifyEmail } from '../api/auth';
import { OtpInput } from '../components/ui/OtpInput';
import { useGoogleAuth } from '../hooks/useAuth';

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { level: 3, label: 'Good', color: 'bg-yellow-500' };
  if (score <= 4) return { level: 4, label: 'Strong', color: 'bg-emerald-500' };
  return { level: 5, label: 'Excellent', color: 'bg-emerald-600' };
}

export function SignUpPage() {
  const navigate = useNavigate();
  const googleAuthMutation = useGoogleAuth();
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState('');
  const [authState, setAuthState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyState, setVerifyState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [verifyError, setVerifyError] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendError, setResendError] = useState('');
  const passwordStrength = getPasswordStrength(form.password);
  const normalizedVerificationCode = verificationCode.replace(/\D/g, '');

  const handleVerifyCode = async () => {
    if (!verificationEmail || normalizedVerificationCode.length !== 6 || verifyState === 'loading') {
      if (normalizedVerificationCode.length !== 6) {
        setVerifyError('Enter the 6-digit code sent to your email.');
      }
      return;
    }
    setVerifyError('');
    setVerifyState('loading');
    try {
      await verifyEmail(verificationEmail, normalizedVerificationCode);
      setVerifyState('success');
      navigate('/onboarding');
    } catch (err) {
      setVerifyState('error');
      setVerifyError(err instanceof Error ? err.message : 'Verification failed.');
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const result = await googleAuthMutation.mutateAsync(tokenResponse.access_token);
        // Google users skip email verification — go straight to onboarding or dashboard.
        if (result.is_new_user) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        setAuthState('idle');
        setAuthError(err instanceof Error ? err.message : 'Google sign-in failed.');
      }
    },
    onError: () => {
      setAuthState('idle');
      setAuthError('Google sign-in failed. Please try again.');
    },
  });

  const handleGoogleSignUp = () => {
    setAuthState('loading');
    setLoadingMessage('Connecting to Google...');
    googleLogin();
  };

  useEffect(() => {
    if (step === 'verify' && normalizedVerificationCode.length === 6 && verifyState !== 'loading') {
      void handleVerifyCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedVerificationCode, step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const newErrors: Record<string, string> = {};
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setAuthState('loading');
    setLoadingMessage('Creating your account...');
    try {
      await signUp(form.email, form.password);
    } catch (err) {
      setAuthState('idle');
      setAuthError(err instanceof Error ? err.message : 'Sign up failed');
      return;
    }
    setVerificationEmail(form.email.trim().toLowerCase());
    setAuthState('success');
    setLoadingMessage('Verification code sent. Check your inbox.');
    setStep('verify');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex justify-center mb-8">
          <Logo size="md" />
        </Link>

        {step === 'form' ? (
          <>
            {authState === 'success' ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold mb-1">Check your inbox</h2>
                <p className="text-sm text-muted-foreground">{loadingMessage}</p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-8">
                <h1 className="text-xl font-semibold text-center mb-1">Create your account</h1>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Start generating high-converting ads today
                </p>

                {authError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                    {authError}
                  </div>
                )}

                {/* Google */}
                <button
                  onClick={handleGoogleSignUp}
                  disabled={authState === 'loading'}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 mb-5"
                >
                  {authState === 'loading' ? (
                    <Loader2Icon className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  {authState === 'loading' ? 'Connecting...' : 'Continue with Google'}
                </button>

                <div className="relative mb-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-card text-muted-foreground">or</span>
                  </div>
                </div>

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
                    <label className="block text-sm font-medium mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
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
                    {form.password ? (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= passwordStrength.level ? passwordStrength.color : 'bg-muted'}`} />
                          ))}
                        </div>
                        <p className={`text-xs ${passwordStrength.level <= 1 ? 'text-red-500' : passwordStrength.level <= 2 ? 'text-orange-500' : passwordStrength.level <= 3 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                          {passwordStrength.label}{passwordStrength.level <= 2 && ' — try adding numbers or symbols'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Must be at least 8 characters</p>
                    )}
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        disabled={authState === 'loading'}
                        className="w-full px-3 py-2 pr-10 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                  </div>

                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    By creating an account, you agree to our{' '}
                    <a href="#" className="text-foreground hover:underline">Terms of Service</a>{' '}
                    and{' '}
                    <a href="#" className="text-foreground hover:underline">Privacy Policy</a>.
                  </p>

                  <button
                    type="submit"
                    disabled={authState === 'loading'}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {authState === 'loading' ? (
                      <><Loader2Icon className="w-4 h-4 animate-spin" /> Creating Account...</>
                    ) : 'Create Account'}
                  </button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Already have an account?{' '}
                  <Link to="/sign-in" className="text-foreground font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-7 h-7 text-blue-600" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Verify your email</h1>
            <p className="text-sm text-muted-foreground mb-4">
              We sent a 6-digit verification code to <span className="font-medium text-foreground">{verificationEmail}</span>.
              You need to verify before signing in or starting onboarding.
            </p>
            <div className="mb-3">
              <OtpInput value={verificationCode} onChange={setVerificationCode} />
            </div>
            {verifyError && (
              <p className="text-xs text-red-500 mb-3">{verifyError}</p>
            )}
            {verifyState === 'success' && (
              <p className="text-xs text-emerald-600 mb-3">Email verified. You can continue.</p>
            )}
            <button
              onClick={() => {
                void handleVerifyCode();
              }}
              disabled={verifyState === 'loading'}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
            >
              {verifyState === 'loading' ? (
                <><Loader2Icon className="w-4 h-4 animate-spin" /> Verifying...</>
              ) : 'Verify code'}
            </button>

            {resendError && (
              <p className="text-xs text-red-500 mb-3">{resendError}</p>
            )}
            {resendState === 'success' && (
              <p className="text-xs text-emerald-600 mb-3">Verification code sent again.</p>
            )}

            <button
              onClick={async () => {
                if (!verificationEmail) return;
                setResendError('');
                setResendState('loading');
                try {
                  await resendVerification(verificationEmail);
                  setResendState('success');
                } catch (err) {
                  setResendState('error');
                  setResendError(err instanceof Error ? err.message : 'Failed to resend verification email.');
                }
              }}
              disabled={resendState === 'loading'}
              className="w-full py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
            >
              {resendState === 'loading' ? (
                <><Loader2Icon className="w-4 h-4 animate-spin" /> Sending...</>
              ) : 'Resend verification code'}
            </button>

            <button
              onClick={() => navigate('/sign-in')}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Go to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
