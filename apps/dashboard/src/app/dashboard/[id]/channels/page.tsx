'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { CategoryCard } from '../../../../components/CategoryCard';
import { Select } from '../../../../components/Select';
import { EVENT_CATEGORIES, GuildConfig } from '@logger/shared';
import { Shield, User, MessageSquare, Mic, Activity, File, Server, ShieldCheck, Hash, Settings } from 'lucide-react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const CATEGORY_META: Record<string, { title: string, desc: string, icon: React.ReactNode }> = {
  Modlogs: { title: 'Modlogs', desc: 'Redirect all modlogs to a different channel, or disable these logs entirely', icon: <Shield size={20} /> },
  Members: { title: 'Members', desc: 'Redirect all member logs to a different channel, or disable these logs entirely', icon: <User size={20} /> },
  Messages: { title: 'Messages', desc: 'Redirect all message logs to a different channel, or disable these logs entirely', icon: <MessageSquare size={20} /> },
  Voice: { title: 'Voice', desc: 'Redirect all voice events logs to a different channel, or disable these logs entirely', icon: <Mic size={20} /> },
  Actions: { title: 'Actions', desc: 'Redirect all server action logs to a different channel, or disable these logs entirely', icon: <Activity size={20} /> },
  Files: { title: 'Files', desc: 'Redirect all file logs to a different channel, or disable these logs entirely', icon: <File size={20} /> },
  Server: { title: 'Server', desc: 'Redirect all server update logs to a different channel, or disable these logs entirely', icon: <Server size={20} /> },
  Roles: { title: 'Roles', desc: 'Redirect all role creation/edited/deletion logs to a different channel, or disable these logs entirely', icon: <ShieldCheck size={20} /> },
  Channels: { title: 'Channels', desc: 'Redirect all channel creation/edited/deletion logs to a different channel, or disable these logs entirely', icon: <Hash size={20} /> },
  Internal: { title: 'Logger Events', desc: 'Redirect all Logger internal events to a different channel, or disable these logs entirely', icon: <Settings size={20} /> },
};

export default function ChannelsPage({ params }: { params: Promise<{ id: string }> }) {
  const [config, setConfig] = useState<GuildConfig | null>(null);
  const [guildId, setGuildId] = useState<string>('');
  const [channels, setChannels] = useState<{id: string, name: string}[]>([]);
  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    params.then(p => {
      setGuildId(p.id);
      fetch(`/api/guilds/${p.id}/config`).then(r => r.json()).then(setConfig);
      fetch(`/api/guilds/${p.id}/channels`).then(r => r.json()).then(data => {
        if (Array.isArray(data)) {
          setChannels(data.filter(c => c.type === 0 || c.type === 5)); // Text channels
        }
      });
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

  const channelOptions = channels.map(c => ({ value: c.id, label: `# ${c.name}` }));

  const toggleCategory = (category: string, enabled: boolean) => {
    const eventIds = EVENT_CATEGORIES[category as keyof typeof EVENT_CATEGORIES] || [];
    setConfig(prev => {
      if (!prev) return prev;
      let newEvents = new Set(prev.enabledEvents);
      if (enabled) {
        eventIds.forEach(id => newEvents.add(id));
      } else {
        eventIds.forEach(id => newEvents.delete(id));
      }
      return { ...prev, enabledEvents: Array.from(newEvents) };
    });
  };

  const isCategoryEnabled = (category: string) => {
    const eventIds = EVENT_CATEGORIES[category as keyof typeof EVENT_CATEGORIES] || [];
    if (eventIds.length === 0) return false;
    return eventIds.some(id => config.enabledEvents.includes(id));
  };

  const handleChannelChange = (category: string, channelId: string) => {
    setConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        channelRoutes: {
          ...prev.channelRoutes,
          [category]: channelId
        }
      };
    });
  };

  return (
    <DashboardLayout guildId={guildId}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">CHANNELS</h2>
          <p className="text-[#8b8b99] text-sm">Set the main serverlog channel and category overrides</p>
        </div>
        <div className="h-6">
          {savedStatus === 'saving' && <span className="text-[#FEE75C] text-sm font-bold">Saving...</span>}
          {savedStatus === 'saved' && <span className="text-[#57F287] text-sm font-bold">Saved ✓</span>}
        </div>
      </div>

      <div className="bg-[#1a1a1f] p-8 rounded-2xl border border-[#3a3a45]">
        <div className="mb-10 pb-10 border-b border-[#3a3a45]">
          <h3 className="text-lg font-bold text-white mb-4">Main Serverlog Channel</h3>
          <Select 
            value={config.channelRoutes['main'] || ''} 
            onChange={e => handleChannelChange('main', e.target.value)}
            options={channelOptions} 
            placeholder="Select channel"
            className="max-w-md"
          />
        </div>

        <div className="flex flex-col">
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <CategoryCard
              key={key}
              title={meta.title}
              description={meta.desc}
              icon={meta.icon}
              enabled={isCategoryEnabled(key)}
              onToggle={(checked) => toggleCategory(key, checked)}
            >
              <Select 
                value={config.channelRoutes[key] || ''} 
                onChange={e => handleChannelChange(key, e.target.value)}
                options={channelOptions} 
                placeholder="Select channel"
                disabled={!isCategoryEnabled(key)}
              />
            </CategoryCard>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
