import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({ options, value, onChange, placeholder = 'Select...', className = '', disabled = false }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        className={`w-full flex items-center justify-between bg-surface border ${isOpen ? 'border-accent shadow-[0_0_15px_var(--color-accent-glow)]' : 'border-border/60'} text-text text-[13px] rounded-xl px-4 py-2.5 outline-none hover:border-accent/40 spring-transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`block truncate font-medium ${selectedOption ? 'text-text' : 'text-text-muted'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-text-muted spring-transition flex-shrink-0 ml-2 ${isOpen ? 'rotate-180 text-text' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-surface/95 backdrop-blur-xl border border-border rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] max-h-60 overflow-y-auto overscroll-contain animate-in fade-in slide-in-from-top-2 duration-200 no-scrollbar p-1">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-text-muted text-center">No options available</div>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {options.map((opt) => (
                <li
                  key={opt.value}
                  className={`px-3 py-2.5 text-sm flex items-center justify-between cursor-pointer spring-transition rounded-lg ${
                    value === opt.value ? 'text-accent bg-accent/10 font-medium' : 'text-text hover:bg-surface-2'
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <Check size={16} className="flex-shrink-0 ml-2" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
