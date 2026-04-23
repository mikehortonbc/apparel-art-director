import { SelectHTMLAttributes, forwardRef } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(' ');
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={cx(
        'block w-full rounded-md border border-border bg-[#0b1220] px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
