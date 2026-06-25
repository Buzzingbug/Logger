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
        className={`w-full flex items-center justify-between bg-[#09090b]/80 backdrop-blur-sm border ${isOpen ? 'border-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'border-[#27272a]'} text-[#e4e4e7] text-sm rounded-lg px-3.5 py-2.5 outline-none hover:border-[#3b82f6]/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`block truncate ${selectedOption ? 'text-[#e4e4e7]' : 'text-[#a1a1aa]'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-[#a1a1aa] transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180 text-[#e4e4e7]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1.5 bg-[#18181b]/95 backdrop-blur-md border border-[#27272a] rounded-lg shadow-2xl max-h-60 overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 origin-top">
          {options.length === 0 ? (
            <div className="px-3 py-3 text-sm text-[#a1a1aa] text-center">No options available</div>
          ) : (
            <ul className="py-1">
              {options.map((opt) => (
                <li
                  key={opt.value}
                  className={`px-3 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors mx-1 rounded-md ${
                    value === opt.value ? 'text-[#3b82f6] bg-[#3b82f6]/10 font-medium' : 'text-[#e4e4e7] hover:bg-[#27272a]'
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
