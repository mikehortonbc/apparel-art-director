import { HTMLAttributes, forwardRef } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement>;

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cx(
        'rounded-lg border border-border bg-[#111827] p-4 text-foreground shadow-sm',
        className
      )}
      {...props}
    />
  );
});
