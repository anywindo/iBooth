import React from 'react';

const VARIANT_CLASS = {
  default: '',
  primary: 'primary',
  warning: 'warning',
  danger: 'danger',
  ghost: 'ghost',
  icon: 'icon',
  ai: 'ai-button'
};

export function Button({
  children,
  className = '',
  type = 'button',
  variant = 'default',
  ...props
}) {
  const classes = [VARIANT_CLASS[variant] ?? '', className].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes || undefined} {...props}>
      {children}
    </button>
  );
}

export default Button;
