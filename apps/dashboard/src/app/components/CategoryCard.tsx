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
    <div className={`bg-surface/40 backdrop-blur-xl border border-border p-4 sm:p-5 md:p-6 rounded-2xl mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 spring-transition hover:bg-surface/80 hover:border-accent/30 group ${enabled ? 'shadow-[0_4px_25px_-5px_rgba(0,0,0,0.3)] border-accent/20' : ''}`}>
      <div className="flex flex-col flex-1 pr-0 sm:pr-4">
        <h3 className="flex items-center gap-3 text-base sm:text-lg font-semibold text-text mb-1.5">
          {icon && <span className={`spring-transition ${enabled ? 'text-accent' : 'text-text-muted group-hover:text-text'}`}>{icon}</span>}
          {title}
        </h3>
        <p className="text-sm text-text-muted leading-relaxed max-w-xl">{description}</p>
      </div>
      <div className="flex flex-col sm:items-end gap-3 w-full sm:w-64 flex-shrink-0 mt-2 sm:mt-0">
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full">
          <span className={`text-sm font-medium hidden sm:inline-block spring-transition ${enabled ? 'text-accent' : 'text-text-muted'}`}>
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
          <Toggle checked={enabled} onChange={onToggle} />
        </div>
        {children && (
          <div className={`w-full mt-1 sm:mt-2 transition-all duration-300 ${enabled ? 'opacity-100 translate-y-0' : 'opacity-50 pointer-events-none -translate-y-1'}`}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
