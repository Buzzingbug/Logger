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
    <div className="border border-[#3a3a45] bg-[#1a1a1f] p-5 rounded-xl mb-3 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors hover:border-[#c336c3]/40">
      <div className="flex items-start gap-4 flex-1">
        <div className="mt-0.5">
          <Toggle checked={enabled} onChange={onToggle} />
        </div>
        <div className="flex-1">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#e8e8ed]">
            {icon && <span className="text-[#c336c3]">{icon}</span>}
            {title}
            <Info className="w-4 h-4 text-[#8b8b99] hover:text-[#e8e8ed] transition-colors cursor-help" />
          </h3>
          <p className="text-sm text-[#8b8b99] mt-1">{description}</p>
        </div>
      </div>
      {children && (
        <div className="w-full sm:w-72 mt-3 sm:mt-0 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
