import React from 'react';
import { Toggle } from './Toggle';
import { ChevronDown, Info } from 'lucide-react';

interface CategoryCardProps {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (checked: boolean) => void;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function CategoryCard({ title, description, enabled, onToggle, icon, children }: CategoryCardProps) {
  return (
    <div className="bg-[#18181b]/50 border border-[#27272a] p-4 sm:p-5 md:p-6 rounded-xl mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 transition-all hover:bg-[#18181b] hover:border-[#3b82f6]/40 group">
      <div className="flex flex-col flex-1 pr-0 sm:pr-4">
        <h3 className="flex items-center gap-2.5 text-base sm:text-lg font-semibold text-[#e4e4e7] mb-1">
          {icon && <span className="text-[#a1a1aa] group-hover:text-[#e4e4e7] transition-colors">{icon}</span>}
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[#a1a1aa] leading-relaxed max-w-xl">{description}</p>
      </div>
      <div className="flex flex-col sm:items-end gap-3 w-full sm:w-64 flex-shrink-0 mt-2 sm:mt-0">
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full">
          <span className="text-sm text-[#e4e4e7] font-medium hidden sm:inline-block">{enabled ? 'Enabled' : 'Disabled'}</span>
          <Toggle checked={enabled} onChange={onToggle} />
        </div>
        {children && (
          <div className="w-full mt-1 sm:mt-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
