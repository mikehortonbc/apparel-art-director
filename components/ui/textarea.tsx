import { TextareaHTMLAttributes, forwardRef } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cx(
        'block w-full rounded-md border border-border bg-[#0b1220] px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
});
