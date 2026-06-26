'use client';

import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full spring-transition focus:outline-none border ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${checked ? 'bg-accent border-accent shadow-[0_0_12px_var(--color-accent-glow)]' : 'bg-surface-2 border-border hover:bg-border'}`}
      role="switch"
      aria-checked={checked}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-[1px] h-[20px] w-[20px] rounded-full bg-white spring-transition shadow-sm ${
          checked ? 'left-[21px]' : 'left-[1px]'
        }`}
      />
    </button>
  );
}
