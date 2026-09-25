const variants = {
  primary: 'bg-sky-700 text-white hover:bg-sky-800 focus-visible:outline-sky-700',
  secondary:
    'border border-slate-300 bg-white text-slate-800 hover:border-sky-400 hover:bg-sky-50 focus-visible:outline-sky-700',
  danger: 'bg-red-700 text-white hover:bg-red-800 focus-visible:outline-red-700',
  ghost: 'bg-transparent text-sky-800 hover:bg-sky-50 focus-visible:outline-sky-700',
};

const sizes = {
  sm: 'min-h-9 px-3 py-1.5 text-sm',
  md: 'min-h-11 px-5 py-2.5',
};

function buttonClass(variant = 'primary', size = 'md', extra = '') {
  return `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  return <Component className={buttonClass(variant, size, className)} {...props} />;
}
