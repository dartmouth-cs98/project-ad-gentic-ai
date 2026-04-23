import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { Loader2Icon } from 'lucide-react';
import { requestPasswordReset, resetPassword } from '../api/auth';
import { OtpInput } from '../components/ui/OtpInput';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const normalizedCode = code.replace(/\D/g, '');

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex justify-center mb-8">
          <Logo size="md" />
        </Link>

        <div className="bg-card border border-border rounded-xl p-8">
          <h1 className="text-xl font-semibold text-center mb-1">
            {step === 'request' ? 'Reset your password' : 'Enter reset code'}
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            {step === 'request'
              ? 'We will send a one-time code to your email.'
              : 'Use the code from your email and choose a new password.'}
          </p>

          {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
          {message && <p className="mb-3 text-xs text-emerald-600">{message}</p>}

          {step === 'request' ? (
            <div className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
              <button
                onClick={async () => {
                  if (!email.trim()) {
                    setError('Email is required.');
                    return;
                  }
                  setError('');
                  setMessage('');
                  setLoading(true);
                  try {
                    const res = await requestPasswordReset(email.trim());
                    setMessage(res.message);
                    setStep('confirm');
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to request password reset.');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Sending...</> : 'Send reset code'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
              <OtpInput value={code} onChange={setCode} />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
              <button
                onClick={async () => {
                  if (!email.trim() || normalizedCode.length !== 6 || newPassword.length < 8) {
                    setError('Provide email, 6-digit code, and a password with at least 8 characters.');
                    return;
                  }
                  setError('');
                  setMessage('');
                  setLoading(true);
                  try {
                    const res = await resetPassword(email.trim(), normalizedCode, newPassword);
                    setMessage(res.message);
                    setTimeout(() => navigate('/sign-in'), 800);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to reset password.');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2Icon className="w-4 h-4 animate-spin" /> Resetting...</> : 'Reset password'}
              </button>
            </div>
          )}

          <button
            onClick={() => navigate('/sign-in')}
            className="w-full mt-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
