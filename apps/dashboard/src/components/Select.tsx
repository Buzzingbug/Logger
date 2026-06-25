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
        className={`w-full flex items-center justify-between bg-[#1a1a1f] border ${isOpen ? 'border-[#c336c3]' : 'border-[#3a3a45]'} text-[#e8e8ed] text-sm rounded-xl px-4 py-2.5 outline-none hover:border-[#c336c3]/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-[#e8e8ed]' : 'text-[#8b8b99]'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-[#8b8b99] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#1a1a1f] border border-[#3a3a45] rounded-xl shadow-xl max-h-60 overflow-y-auto overscroll-contain animate-in fade-in slide-in-from-top-2">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-[#8b8b99] text-center">No options available</div>
          ) : (
            <ul className="py-1">
              {options.map((opt) => (
                <li
                  key={opt.value}
                  className={`px-4 py-2 text-sm flex items-center justify-between cursor-pointer hover:bg-[#c336c3]/10 transition-colors ${
                    value === opt.value ? 'text-[#c336c3] bg-[#c336c3]/5' : 'text-[#e8e8ed]'
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  {opt.label}
                  {value === opt.value && <Check size={16} />}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
