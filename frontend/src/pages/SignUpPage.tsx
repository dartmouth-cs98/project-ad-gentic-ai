import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Loader2Icon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { signUp, resendVerification, verifyEmail } from '../api/auth';
import { OtpInput } from '../components/ui/OtpInput';
import { useGoogleAuth } from '../hooks/useAuth';
import '../landing.css';

/* ── Helpers ── */

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function getPasswordStrength(password: string): { level: number; label: string } {
  if (!password) return { level: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { level: 1, label: 'Weak' };
  if (score <= 2) return { level: 2, label: 'Fair' };
  if (score <= 3) return { level: 3, label: 'Good' };
  if (score <= 4) return { level: 4, label: 'Strong' };
  return { level: 5, label: 'Excellent' };
}

/* Always-dark brand panel */
function AuthBrand() {
  return (
    <div className="lp-auth-brand">
      <div>
        <Link to="/" className="lp-auth-brand-link">
          <span className="lp-auth-brand-icon" />
          <span className="lp-auth-brand-word">ADGENTIC</span>
        </Link>
        <h2 className="lp-auth-brand-headline">
          Generate, score,<br />launch — fast.
        </h2>
        <p className="lp-auth-brand-sub">
          AI-powered ad generation for teams that ship every week.
        </p>
      </div>
      <ul className="lp-auth-brand-bullets">
        <li className="lp-auth-brand-bullet">· No card required to start</li>
        <li className="lp-auth-brand-bullet">· 14-day Premium trial</li>
        <li className="lp-auth-brand-bullet">· Cancel anytime</li>
      </ul>
    </div>
  );
}

/* ── Page ── */

export function SignUpPage() {
  const navigate = useNavigate();
  const googleAuthMutation = useGoogleAuth();

  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState('');
  const [authState, setAuthState] = useState<'idle' | 'loading'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyState, setVerifyState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [verifyError, setVerifyError] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendError, setResendError] = useState('');

  const passwordStrength = getPasswordStrength(form.password);
  const normalizedVerificationCode = verificationCode.replace(/\D/g, '');

  /* Auto-verify when OTP is fully entered */
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

  useEffect(() => {
    if (step === 'verify' && normalizedVerificationCode.length === 6 && verifyState !== 'loading') {
      void handleVerifyCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedVerificationCode, step]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const result = await googleAuthMutation.mutateAsync(tokenResponse.access_token);
        navigate(result.is_new_user ? '/onboarding' : '/dashboard');
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
    try {
      await signUp(form.email, form.password);
    } catch (err) {
      setAuthState('idle');
      setAuthError(err instanceof Error ? err.message : 'Sign up failed');
      return;
    }
    setVerificationEmail(form.email.trim().toLowerCase());
    setAuthState('idle');
    setStep('verify');
  };

  return (
    <div className="landing-page lp-auth-layout">
      <AuthBrand />

      <div className="lp-auth-main">
        <div className="lp-auth-form-wrap">
          {step === 'form' ? (
            <>
              <h1 className="lp-auth-title">Create your account.</h1>
              <p className="lp-auth-subtitle">Start generating high-converting ads today.</p>

              {authError && (
                <div className="lp-auth-banner error">{authError}</div>
              )}

              <button
                type="button"
                onClick={() => { setAuthState('loading'); googleLogin(); }}
                disabled={authState === 'loading'}
                className="lp-auth-google"
              >
                {authState === 'loading'
                  ? <Loader2Icon size={18} className="lp-auth-spinner" />
                  : <GoogleIcon />}
                {authState === 'loading' ? 'Connecting...' : 'Continue with Google'}
              </button>

              <div className="lp-auth-divider"><span>or</span></div>

              <form onSubmit={handleSubmit}>
                <div className="lp-auth-field">
                  <label className="lp-auth-label">Email</label>
                  <div className="lp-auth-input-wrap">
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      disabled={authState === 'loading'}
                      className="lp-auth-input"
                    />
                  </div>
                  {errors.email && <p className="lp-auth-field-err">{errors.email}</p>}
                </div>

                <div className="lp-auth-field">
                  <label className="lp-auth-label">Password</label>
                  <div className="lp-auth-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      disabled={authState === 'loading'}
                      className="lp-auth-input has-icon"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="lp-auth-eye"
                    >
                      {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>

                  {form.password ? (
                    <div className="lp-auth-strength">
                      <div className="lp-auth-strength-bars">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`lp-auth-strength-bar${i <= passwordStrength.level ? ` s${passwordStrength.level}` : ''}`}
                          />
                        ))}
                      </div>
                      <span className="lp-auth-strength-label">
                        {passwordStrength.label}
                        {passwordStrength.level <= 2 && ' — add numbers or symbols'}
                      </span>
                    </div>
                  ) : (
                    <p className="lp-auth-hint">Must be at least 8 characters</p>
                  )}
                  {errors.password && <p className="lp-auth-field-err">{errors.password}</p>}
                </div>

                <div className="lp-auth-field">
                  <label className="lp-auth-label">Confirm password</label>
                  <div className="lp-auth-input-wrap">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      disabled={authState === 'loading'}
                      className="lp-auth-input has-icon"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="lp-auth-eye"
                    >
                      {showConfirmPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="lp-auth-field-err">{errors.confirmPassword}</p>}
                </div>

                <p className="lp-auth-legal">
                  By creating an account you agree to our{' '}
                  <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
                </p>

                <button
                  type="submit"
                  disabled={authState === 'loading'}
                  className="lp-auth-submit"
                >
                  {authState === 'loading' ? (
                    <><Loader2Icon size={16} className="lp-auth-spinner" /> Creating account...</>
                  ) : 'Create account'}
                </button>
              </form>

              <p className="lp-auth-footer">
                Already have an account?{' '}
                <Link to="/sign-in">Sign in</Link>
              </p>
            </>
          ) : (
            /* ── Verify step ── */
            <>
              <h1 className="lp-auth-title">Check your inbox.</h1>
              <p className="lp-auth-subtitle">
                We sent a 6-digit code to{' '}
                <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{verificationEmail}</strong>.
              </p>

              {/* OTP inputs styled via .lp-auth-otp in landing.css */}
              <div className="lp-auth-otp">
                <OtpInput value={verificationCode} onChange={setVerificationCode} />
              </div>

              {verifyError && <p className="lp-auth-field-err" style={{ marginBottom: 12 }}>{verifyError}</p>}
              {verifyState === 'success' && (
                <p style={{ fontSize: 12, color: '#059669', marginBottom: 12 }}>Email verified.</p>
              )}

              <button
                type="button"
                onClick={() => void handleVerifyCode()}
                disabled={verifyState === 'loading'}
                className="lp-auth-submit"
              >
                {verifyState === 'loading' ? (
                  <><Loader2Icon size={16} className="lp-auth-spinner" /> Verifying...</>
                ) : 'Verify code'}
              </button>

              {resendError && <p className="lp-auth-field-err" style={{ marginTop: 8 }}>{resendError}</p>}
              {resendState === 'success' && (
                <p style={{ fontSize: 12, color: '#059669', marginTop: 8 }}>Code sent again.</p>
              )}

              <button
                type="button"
                onClick={async () => {
                  if (!verificationEmail) return;
                  setResendError('');
                  setResendState('loading');
                  try {
                    await resendVerification(verificationEmail);
                    setResendState('success');
                  } catch (err) {
                    setResendState('error');
                    setResendError(err instanceof Error ? err.message : 'Failed to resend.');
                  }
                }}
                disabled={resendState === 'loading'}
                className="lp-auth-secondary"
              >
                {resendState === 'loading' ? (
                  <><Loader2Icon size={14} className="lp-auth-spinner" /> Sending...</>
                ) : 'Resend code'}
              </button>

              <p className="lp-auth-footer">
                <Link to="/sign-in">Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
