'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Toggle } from '../../../../components/Toggle';
import { Select } from '../../../../components/Select';
import { GuildConfig } from '@logger/shared';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function OtherOptionsPage({ params }: { params: Promise<{ id: string }> }) {
  const [config, setConfig] = useState<GuildConfig | null>(null);
  const [guildId, setGuildId] = useState<string>('');
  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    params.then(p => {
      setGuildId(p.id);
      fetch(`/api/guilds/${p.id}/config`).then(r => r.json()).then(setConfig);
    });
  }, [params]);

  const debouncedConfig = useDebounce(config, 800);

  useEffect(() => {
    if (!debouncedConfig) return;
    setSavedStatus('saving');
    fetch(`/api/guilds/${guildId}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(debouncedConfig)
    }).then(() => {
      setSavedStatus('saved');
      setTimeout(() => setSavedStatus('idle'), 2000);
    });
  }, [debouncedConfig, guildId]);

  if (!config) return <div className="text-white text-center mt-20">Loading configuration...</div>;

  const getOther = (key: string, defaultValue: any) => {
    return (config.otherOptions as any)?.[key] ?? defaultValue;
  };

  const updateOther = (key: string, value: any) => {
    setConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        otherOptions: {
          ...(prev.otherOptions as object),
          [key]: value
        }
      };
    });
  };

  return (
    <DashboardLayout guildId={guildId}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">OTHER OPTIONS</h2>
          <p className="text-[#8b8b99] text-sm">Miscellaneous settings and integrations.</p>
        </div>
        <div className="h-6">
          {savedStatus === 'saving' && <span className="text-[#FEE75C] text-sm font-bold">Saving...</span>}
          {savedStatus === 'saved' && <span className="text-[#57F287] text-sm font-bold">Saved ✓</span>}
        </div>
      </div>

      <div className="bg-[#1a1a1f] p-8 rounded-2xl border border-[#3a3a45]">
        
        {/* SPOILERS */}
        <div className="border-b border-[#3a3a45] pb-8 mb-8">
          <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2">SPOILERS</h3>
          <p className="text-sm text-[#8b8b99] mb-4">Enable and spoilers are applied to media sent to the serverlogs</p>
          <Toggle 
            checked={getOther('spoilers', false)} 
            onChange={v => updateOther('spoilers', v)} 
          />
        </div>

        {/* BUTTONS */}
        <div className="border-b border-[#3a3a45] pb-8 mb-8">
          <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2">BUTTONS</h3>
          <p className="text-sm text-[#8b8b99] mb-4">Toggle which buttons are included with each log</p>
          <Select 
            value={getOther('buttons', 'all')} 
            onChange={val => updateOther('buttons', val)}
            options={[
              { value: 'all', label: 'All Event Buttons' },
              { value: 'none', label: 'No Event Buttons' },
              { value: 'important', label: 'Important Only' }
            ]}
          />
        </div>

        <div className="border border-[#3a3a45] bg-[#1a1a1f] p-5 rounded-xl mb-3 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors">
          <div className="flex-1">
            <h3 className="flex items-center gap-2 text-lg font-bold text-[#e8e8ed]">Embed Format</h3>
            <p className="text-sm text-[#8b8b99] mt-1">Change the visual style of log embeds</p>
          </div>
          <Select 
            value={getOther('format', 'standard')} 
            onChange={val => updateOther('format', val)}
            options={[
              { value: 'standard', label: 'Standard (Default)' },
              { value: 'compact', label: 'Compact' },
              { value: 'detailed', label: 'Detailed (Pro)' }
            ]}
          />
        </div>

        {/* BOT INTEGRATIONS */}
        <div className="pb-4">
          <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-6">BOT INTEGRATIONS</h3>
          
          <div className="flex gap-3 mb-4">
            <div className="mt-1 text-[#8b8b99]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </div>
            <div>
              <h4 className="text-md font-bold text-[#e8e8ed]">PluralKit Compatibility</h4>
              <p className="text-sm text-[#8b8b99] mt-1 mb-4">Automatically handle PluralKit interactions without cluttering up the logs</p>
            </div>
          </div>
          <div className="pl-9">
            <Toggle 
              checked={getOther('pluralkit', false)} 
              onChange={v => updateOther('pluralkit', v)} 
            />
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
