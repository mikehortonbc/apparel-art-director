import { HTMLAttributes, forwardRef } from 'react';

type BadgeProps = HTMLAttributes<HTMLSpanElement>;

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, ...props },
  ref
) {
  return (
    <span
      ref={ref}
      className={cx(
        'inline-flex items-center rounded-full border border-border bg-[#111827] px-2.5 py-0.5 text-xs font-medium text-foreground',
        className
      )}
      {...props}
    />
  );
});
