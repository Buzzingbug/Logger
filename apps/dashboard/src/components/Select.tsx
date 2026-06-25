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
        className={`w-full flex items-center justify-between bg-[#141419] border ${isOpen ? 'border-[#9f2ba0]' : 'border-[#2c2c35]'} text-[#c4c4cc] text-sm rounded-lg px-3 py-2 outline-none hover:border-[#9f2ba0]/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-[#e8e8ed]' : 'text-[#8b8b99]'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-[#8b8b99] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#141419] border border-[#2c2c35] rounded-lg shadow-xl max-h-60 overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[#8b8b99] text-center">No options available</div>
          ) : (
            <ul className="py-1">
              {options.map((opt) => (
                <li
                  key={opt.value}
                  className={`px-3 py-1.5 text-sm flex items-center justify-between cursor-pointer transition-colors ${
                    value === opt.value ? 'text-[#9f2ba0] bg-[#9f2ba0]/10' : 'text-[#c4c4cc] hover:bg-[#2c2c35]'
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
