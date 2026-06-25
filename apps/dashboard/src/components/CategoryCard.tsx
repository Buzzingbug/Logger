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
    <div className="border-b border-[#3a3a45] py-6 last:border-0">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          {icon && <div className="mt-1 text-[#8b8b99]">{icon}</div>}
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#e8e8ed]">
              {title}
              <Info className="w-4 h-4 text-[#8b8b99] cursor-pointer" />
            </h3>
            <p className="text-sm text-[#8b8b99] mt-1 mb-4">{description}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2 pl-9">
        <Toggle checked={enabled} onChange={onToggle} />
        <div className="flex-1 max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
