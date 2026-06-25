'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { Toggle } from '../../../components/Toggle';
import { GuildConfig } from '@logger/shared';
import { Users, Target, Hash, FolderOpen, MessageSquare, Shield, ShieldCheck, Bot } from 'lucide-react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function ListCard({ title, description, icon, value, onChange, placeholder }: any) {
  return (
    <div className="bg-[#18181b] border border-[#27272a] p-5 rounded-xl mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 transition-colors hover:border-[#3b82f6]/40">
      <div className="flex flex-col flex-1 pr-0 sm:pr-4">
        <h3 className="flex items-center gap-3 text-lg font-semibold text-[#e4e4e7] mb-1">
          {icon && <span className="text-[#a1a1aa]">{icon}</span>}
          {title}
        </h3>
        <p className="text-sm text-[#a1a1aa]">{description}</p>
      </div>
      <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-80 flex-shrink-0">
        <input 
          type="text"
          className="w-full bg-[#09090b] border border-[#27272a] text-[#e4e4e7] text-sm rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6] transition-colors"
          placeholder={placeholder}
          value={value.join(', ')}
          onChange={(e) => onChange(e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
        />
      </div>
    </div>
  );
}

function ToggleCard({ title, description, icon, checked, onChange, isPro }: any) {
  return (
    <div className="bg-[#18181b] border border-[#27272a] p-5 rounded-xl mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 transition-colors hover:border-[#3b82f6]/40">
      <div className="flex flex-col flex-1 pr-0 sm:pr-4">
        <h3 className="flex items-center gap-3 text-lg font-semibold text-[#e4e4e7] mb-1">
          {icon && <span className="text-[#a1a1aa]">{icon}</span>}
          {title}
          {isPro && <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 text-white px-2 py-0.5 rounded ml-2">Pro Lite</span>}
        </h3>
        <p className="text-sm text-[#a1a1aa]">{description}</p>
      </div>
      <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-56 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#e4e4e7] font-medium">{checked ? 'On' : 'Off'}</span>
          <Toggle checked={checked} onChange={onChange} />
        </div>
      </div>
    </div>
  );
}

export default function IgnoreOptionsPage({ params }: { params: Promise<{ id: string }> }) {
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

  const updateList = (field: keyof GuildConfig, value: string[]) => {
    setConfig(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const updateBool = (field: keyof GuildConfig, value: boolean) => {
    setConfig(prev => prev ? { ...prev, [field]: value } : prev);
  };

  return (
    <DashboardLayout guildId={guildId}>
      <div className="mb-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">IGNORE OPTIONS</h2>
        <p className="text-[#8b8b99] text-sm">Fine-tune exactly what gets logged and what is ignored.</p>
      </div>
      
      <div className="flex justify-end mb-6 h-6">
        {savedStatus === 'saving' && <span className="text-[#FEE75C] text-sm font-bold">Saving...</span>}
        {savedStatus === 'saved' && <span className="text-[#57F287] text-sm font-bold">Saved ✓</span>}
      </div>

      <div className="flex flex-col">
        <ListCard 
          icon={<Users size={20} />} title="Executors" description="Executors are the people who carry out an action on another user. (Comma separated IDs)"
          placeholder="Enter user IDs..." value={config.ignoreExecutorUsers || []} onChange={(v: string[]) => updateList('ignoreExecutorUsers', v)}
        />
        <ListCard 
          icon={<Target size={20} />} title="Targets" description="Targets are people the action is done to. (Comma separated IDs)"
          placeholder="Enter user IDs..." value={config.ignoreTargetUsers || []} onChange={(v: string[]) => updateList('ignoreTargetUsers', v)}
        />
        <ListCard 
          icon={<Hash size={20} />} title="Channels" description="Actions involving this channel are not recorded to the serverlog. (Comma separated IDs)"
          placeholder="Search for Channels..." value={config.ignoreChannels || []} onChange={(v: string[]) => updateList('ignoreChannels', v)}
        />
        <ListCard 
          icon={<FolderOpen size={20} />} title="Channel Categories" description="Exclude all events involving channels which belong to a particular category. (Comma separated IDs)"
          placeholder="Search for Categories..." value={config.ignoreCategories || []} onChange={(v: string[]) => updateList('ignoreCategories', v)}
        />
        <ListCard 
          icon={<MessageSquare size={20} />} title="Message Content" description="Messages with this exact content are not recorded to the serverlog when deleted. (Comma separated phrases)"
          placeholder="Add Message Content..." value={config.ignoreMessageContent || []} onChange={(v: string[]) => updateList('ignoreMessageContent', v)}
        />
        <ListCard 
          icon={<Shield size={20} />} title="Role Executors" description="When a user with this role carries out an action on a target, these logs will not be recorded."
          placeholder="Search for Roles..." value={config.ignoreExecutorRoles || []} onChange={(v: string[]) => updateList('ignoreExecutorRoles', v)}
        />
        <ListCard 
          icon={<ShieldCheck size={20} />} title="Role Targets" description="When a user with this role has an action carried out on them, these logs will not be recorded."
          placeholder="Search for Roles..." value={config.ignoreRoles || []} onChange={(v: string[]) => updateList('ignoreRoles', v)}
        />
        <ToggleCard
          icon={<Bot size={20} />} title="Bot Executors" description="Enabled means when an action is carried out BY a bot, it will not be logged."
          isPro={true} checked={config.ignoreBotExecutors} onChange={(v: boolean) => updateBool('ignoreBotExecutors', v)}
        />
        <ToggleCard
          icon={<Bot size={20} />} title="Bot Targets" description="Enabled means when an action is carried out ON a bot, it will not be logged."
          isPro={true} checked={config.ignoreBotTargets} onChange={(v: boolean) => updateBool('ignoreBotTargets', v)}
        />
      </div>
    </DashboardLayout>
  );
}
