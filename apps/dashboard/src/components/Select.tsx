import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ options, placeholder = 'Select...', className = '', ...props }: SelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        className="w-full appearance-none bg-[#1a1a1f] border border-[#3a3a45] text-[#e8e8ed] text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[#c336c3] focus:ring-1 focus:ring-[#c336c3] transition-all cursor-pointer"
        {...props}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#1a1a1f]">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#8b8b99]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
    </div>
  );
}
