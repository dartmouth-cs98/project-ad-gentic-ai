import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resendVerification, verifyEmail } from '../api/auth';
import { Logo } from '../components/ui/Logo';
import { CheckCircleIcon, Loader2Icon } from 'lucide-react';
import { OtpInput } from '../components/ui/OtpInput';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const normalizedCode = code.replace(/\D/g, '');

  useEffect(() => {
    const queryEmail = searchParams.get('email');
    if (queryEmail) setEmail(queryEmail);
  }, [searchParams]);

  const handleVerifyCode = async () => {
    if (!email.trim() || normalizedCode.length !== 6 || state === 'loading') {
      if (normalizedCode.length !== 6) {
        setState('error');
        setMessage('Enter the 6-digit code sent to your email.');
      }
      return;
    }
    setState('loading');
    setMessage('');
    try {
      const res = await verifyEmail(email.trim(), normalizedCode);
      setState('success');
      setMessage(res.message);
      navigate('/onboarding');
    } catch (err) {
      setState('error');
      setMessage(err instanceof Error ? err.message : 'Email verification failed.');
    }
  };

  useEffect(() => {
    if (normalizedCode.length === 6 && state !== 'loading') {
      void handleVerifyCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedCode]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex justify-center mb-8">
          <Logo size="md" />
        </Link>

        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            {state === 'loading' ? (
              <Loader2Icon className="w-7 h-7 text-blue-600 animate-spin" />
            ) : (
              <CheckCircleIcon className={`w-7 h-7 ${state === 'success' ? 'text-emerald-600' : 'text-red-500'}`} />
            )}
          </div>

          <h1 className="text-xl font-semibold mb-2">
            {state === 'success' ? 'Email verified' : 'Verify your email'}
          </h1>
          <p className="text-sm text-muted-foreground mb-5">
            Enter the 6-digit code from your email.
          </p>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 mb-3"
          />
          <div className="mb-3">
            <OtpInput value={code} onChange={setCode} />
          </div>
          {message && (
            <p className={`text-xs mb-3 ${state === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>{message}</p>
          )}

          <button
            onClick={() => {
              void handleVerifyCode();
            }}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors mb-3"
          >
            Verify code
          </button>
          <button
            onClick={async () => {
              setState('loading');
              setMessage('');
              try {
                const res = await resendVerification(email.trim());
                setState('success');
                setMessage(res.message);
              } catch (err) {
                setState('error');
                setMessage(err instanceof Error ? err.message : 'Failed to resend verification code.');
              }
            }}
            className="w-full py-2.5 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-3"
          >
            Resend code
          </button>

          <button
            onClick={() => navigate('/sign-in')}
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Go to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
