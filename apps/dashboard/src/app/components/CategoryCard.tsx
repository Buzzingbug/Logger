import React from 'react';
import { Toggle } from './Toggle';

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
    <div className={`bg-surface border border-border p-5 md:p-6 rounded-2xl flex flex-col gap-4 spring-transition hover:border-border-glow group ${enabled ? 'shadow-[0_4px_25px_-5px_rgba(0,0,0,0.3)]' : ''}`}>
      
      {/* Card Header */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col flex-1 pr-4">
          <h3 className="flex items-center gap-3 text-lg font-semibold text-text mb-1">
            {icon && <span className={`spring-transition ${enabled ? 'text-accent' : 'text-text-muted group-hover:text-text'}`}>{icon}</span>}
            {title}
          </h3>
          <p className="text-[13px] text-text-muted leading-relaxed">{description}</p>
        </div>
        <div className="flex-shrink-0 mt-1">
          <Toggle checked={enabled} onChange={onToggle} />
        </div>
      </div>

      {/* Children (Individual Events / Channel Selector) */}
      {children && (
        <div className={`w-full mt-2 pt-4 border-t border-border/50 transition-all duration-300 ${enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          {children}
        </div>
      )}
    </div>
  );
}
