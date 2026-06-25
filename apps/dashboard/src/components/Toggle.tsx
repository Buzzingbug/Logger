'use client';

import React from 'react';
import './Toggle.css';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <div 
      className={`toggle ${disabled ? 'disabled' : ''}`} 
      data-checked={checked}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
    >
      <div className="toggle-thumb" />
    </div>
  );
}
