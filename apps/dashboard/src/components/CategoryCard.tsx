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
    <div className="bg-[#18181b] border border-[#27272a] p-5 rounded-xl mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 transition-colors hover:border-[#3b82f6]/40">
      <div className="flex flex-col flex-1 pr-0 sm:pr-4">
        <h3 className="flex items-center gap-3 text-lg font-semibold text-[#e4e4e7] mb-1">
          {icon && <span className="text-[#a1a1aa]">{icon}</span>}
          {title}
        </h3>
        <p className="text-sm text-[#a1a1aa]">{description}</p>
      </div>
      <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-56 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#e4e4e7] font-medium">{enabled ? 'On' : 'Off'}</span>
          <Toggle checked={enabled} onChange={onToggle} />
        </div>
        {children && (
          <div className="w-full mt-1">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
