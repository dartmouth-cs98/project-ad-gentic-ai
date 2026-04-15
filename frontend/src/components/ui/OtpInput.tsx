import { useRef } from 'react';

interface OtpInputProps {
  value: string;
  length?: number;
  onChange: (value: string) => void;
}

export function OtpInput({ value, length = 6, onChange }: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  return (
    <div className="flex items-center justify-center gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '');
            if (!raw) {
              const next = value.split('');
              next[index] = '';
              onChange(next.join('').slice(0, length));
              return;
            }
            const next = value.split('');
            next[index] = raw[0];
            const normalized = next.join('').slice(0, length);
            onChange(normalized);
            if (index < length - 1) refs.current[index + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digit && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
            if (!pasted) return;
            onChange(pasted);
            const focusIndex = Math.min(pasted.length - 1, length - 1);
            refs.current[focusIndex]?.focus();
          }}
          className="w-10 h-12 text-center text-lg font-semibold bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground/20"
        />
      ))}
    </div>
  );
}
