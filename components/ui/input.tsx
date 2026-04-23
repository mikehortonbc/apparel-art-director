import { InputHTMLAttributes, forwardRef } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type ?? 'text'}
      className={cx(
        'block w-full rounded-md border border-border bg-[#0b1220] px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
});
