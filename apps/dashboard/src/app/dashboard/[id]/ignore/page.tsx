'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Toggle } from '../../../../components/Toggle';
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

function ListInput({ label, desc, icon, value, onChange, placeholder }: any) {
  return (
    <div className="border-b border-[#3a3a45] py-6 last:border-0">
      <div className="flex gap-3 mb-4">
        <div className="mt-1 text-[#8b8b99]">{icon}</div>
        <div>
          <h3 className="text-lg font-bold text-[#e8e8ed]">{label}</h3>
          <p className="text-sm text-[#8b8b99] mt-1">{desc}</p>
        </div>
      </div>
      <input 
        type="text"
        className="w-full bg-[#1a1a1f] border border-[#3a3a45] text-[#e8e8ed] text-sm rounded-xl px-4 py-3 outline-none focus:border-[#c336c3] focus:ring-1 focus:ring-[#c336c3] transition-all"
        placeholder={placeholder}
        value={value.join(', ')}
        onChange={(e) => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
      />
    </div>
  );
}

function ToggleInput({ label, desc, icon, checked, onChange, isPro }: any) {
  return (
    <div className="border-b border-[#3a3a45] py-6 last:border-0">
      <div className="flex gap-3 mb-4">
        <div className="mt-1 text-[#8b8b99]">{icon}</div>
        <div>
          <h3 className="flex items-center gap-3 text-lg font-bold text-[#e8e8ed]">
            {label}
            {isPro && <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 text-white px-2 py-0.5 rounded">Pro Lite</span>}
          </h3>
          <p className="text-sm text-[#8b8b99] mt-1">{desc}</p>
        </div>
      </div>
      <div className="pl-9">
        <Toggle checked={checked} onChange={onChange} />
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">IGNORE OPTIONS</h2>
          <p className="text-[#8b8b99] text-sm">Fine-tune exactly what gets logged and what is ignored.</p>
        </div>
        <div className="h-6">
          {savedStatus === 'saving' && <span className="text-[#FEE75C] text-sm font-bold">Saving...</span>}
          {savedStatus === 'saved' && <span className="text-[#57F287] text-sm font-bold">Saved ✓</span>}
        </div>
      </div>

      <div className="bg-[#1a1a1f] p-8 rounded-2xl border border-[#3a3a45]">
        <ListInput 
          icon={<Users size={20} />} label="Executors" desc="Executors are the people who carry out an action on another user. (Comma separated IDs)"
          placeholder="Enter user IDs..." value={config.ignoreExecutorUsers || []} onChange={(v: string[]) => updateList('ignoreExecutorUsers', v)}
        />
        <ListInput 
          icon={<Target size={20} />} label="Targets" desc="Targets are people the action is done to. (Comma separated IDs)"
          placeholder="Enter user IDs..." value={config.ignoreTargetUsers || []} onChange={(v: string[]) => updateList('ignoreTargetUsers', v)}
        />
        <ListInput 
          icon={<Hash size={20} />} label="Channels" desc="Actions involving this channel are not recorded to the serverlog. (Comma separated IDs)"
          placeholder="Search for Channels..." value={config.ignoreChannels || []} onChange={(v: string[]) => updateList('ignoreChannels', v)}
        />
        <ListInput 
          icon={<FolderOpen size={20} />} label="Channel Categories" desc="Exclude all events involving channels which belong to a particular category. (Comma separated IDs)"
          placeholder="Search for Categories..." value={config.ignoreCategories || []} onChange={(v: string[]) => updateList('ignoreCategories', v)}
        />
        <ListInput 
          icon={<MessageSquare size={20} />} label="Message Content" desc="Messages with this exact content are not recorded to the serverlog when deleted. (Comma separated phrases)"
          placeholder="Add Message Content..." value={config.ignoreMessageContent || []} onChange={(v: string[]) => updateList('ignoreMessageContent', v)}
        />
        <ListInput 
          icon={<Shield size={20} />} label="Role Executors" desc="When a user with this role carries out an action on a target, these logs will not be recorded."
          placeholder="Search for Roles..." value={config.ignoreExecutorRoles || []} onChange={(v: string[]) => updateList('ignoreExecutorRoles', v)}
        />
        <ListInput 
          icon={<ShieldCheck size={20} />} label="Role Targets" desc="When a user with this role has an action carried out on them, these logs will not be recorded."
          placeholder="Search for Roles..." value={config.ignoreRoles || []} onChange={(v: string[]) => updateList('ignoreRoles', v)}
        />
        <ToggleInput
          icon={<Bot size={20} />} label="Bot Executors" desc="Enabled means when an action is carried out BY a bot, it will not be logged."
          isPro={true} checked={config.ignoreBotExecutors} onChange={(v: boolean) => updateBool('ignoreBotExecutors', v)}
        />
        <ToggleInput
          icon={<Bot size={20} />} label="Bot Targets" desc="Enabled means when an action is carried out ON a bot, it will not be logged."
          isPro={true} checked={config.ignoreBotTargets} onChange={(v: boolean) => updateBool('ignoreBotTargets', v)}
        />
      </div>
    </DashboardLayout>
  );
}
