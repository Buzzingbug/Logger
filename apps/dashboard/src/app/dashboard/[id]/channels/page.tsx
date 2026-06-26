'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { CategoryCard } from '../../../components/CategoryCard';
import { Select } from '../../../components/Select';
import { EVENT_CATEGORIES, EVENT_NAMES, GuildConfig } from '@logger/shared';
import { Shield, User, MessageSquare, Mic, Activity, File, Server, ShieldCheck, Hash, Settings } from 'lucide-react';
import { Toggle } from '../../../components/Toggle';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const CATEGORY_META: Record<string, { title: string, desc: string, icon: React.ReactNode }> = {
  Modlogs: { title: 'Modlogs', desc: 'Log moderative actions like bans, kicks, and timeouts.', icon: <Shield size={20} /> },
  Members: { title: 'Members', desc: 'Log member joins, leaves, and profile updates.', icon: <User size={20} /> },
  Messages: { title: 'Messages', desc: 'Log message edits, deletions, and pinned messages.', icon: <MessageSquare size={20} /> },
  Voice: { title: 'Voice', desc: 'Log voice channel joins, leaves, and activity.', icon: <Mic size={20} /> },
  Actions: { title: 'Actions', desc: 'Log server action events.', icon: <Activity size={20} /> },
  Files: { title: 'Files', desc: 'Log file uploads and deletions.', icon: <File size={20} /> },
  Server: { title: 'Server', desc: 'Log server property updates.', icon: <Server size={20} /> },
  Roles: { title: 'Roles', desc: 'Log role creation, edits, and deletions.', icon: <ShieldCheck size={20} /> },
  Channels: { title: 'Channels', desc: 'Log channel creation, edits, and deletions.', icon: <Hash size={20} /> },
  Internal: { title: 'Logger Events', desc: 'Log internal Logger system events.', icon: <Settings size={20} /> },
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

  if (!config) return <div className="text-text text-center mt-20 animate-pulse font-medium">Loading configuration...</div>;

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

  const toggleEvent = (eventId: number, enabled: boolean) => {
    setConfig(prev => {
      if (!prev) return prev;
      let newEvents = new Set(prev.enabledEvents);
      if (enabled) newEvents.add(eventId);
      else newEvents.delete(eventId);
      return { ...prev, enabledEvents: Array.from(newEvents) };
    });
  };

  const toggleOtherOption = (optionKey: string, enabled: boolean) => {
    setConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        otherOptions: {
          ...(prev.otherOptions as Record<string, any> || {}),
          [optionKey]: enabled
        }
      };
    });
  };

  return (
    <DashboardLayout guildId={guildId}>
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-text uppercase tracking-tight mb-2">Channels Configuration</h2>
        <p className="text-text-muted text-sm sm:text-base max-w-2xl">Configure channel-specific logging settings for different server activities. Events will be logged to these channels when they occur.</p>
      </div>
      
      <div className="flex justify-end mb-6 h-6 items-center">
        {savedStatus === 'saving' && <span className="text-warning text-sm font-bold animate-pulse flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-warning"></div> Saving changes...</span>}
        {savedStatus === 'saved' && <span className="text-success text-sm font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success"></div> All changes saved</span>}
      </div>

      <div className="flex flex-col">
        <div className="relative z-[50] focus-within:z-[60] hover:z-[60] bg-surface border border-border p-5 md:p-6 rounded-2xl mb-8 spring-transition hover:border-border-glow group card-gradient shadow-lg">
          <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
            <span className="w-2 h-6 bg-accent rounded-full hidden sm:block"></span>
            Main Serverlog Channel
          </h3>
          <Select 
            value={config.channelRoutes['main'] || ''} 
            onChange={val => handleChannelChange('main', val)}
            options={channelOptions} 
            placeholder="Select channel"
          />
        </div>

        {/* Grid Layout for Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(CATEGORY_META).map(([key, meta], index) => {
            const eventIds = EVENT_CATEGORIES[key as keyof typeof EVENT_CATEGORIES] || [];
            return (
              <div key={key} style={{ zIndex: 49 - index }} className="relative focus-within:z-[60] hover:z-[60] flex h-full">
                <div className="w-full h-full">
                  <CategoryCard
                    title={meta.title}
                    description={meta.desc}
                    icon={meta.icon}
                    enabled={isCategoryEnabled(key)}
                    onToggle={(checked) => toggleCategory(key, checked)}
                  >
                    <div className="flex flex-col gap-4 w-full mt-2">
                      <Select 
                        value={config.channelRoutes[key] || ''} 
                        onChange={val => handleChannelChange(key, val)}
                        options={channelOptions} 
                        placeholder="Select channel"
                        disabled={!isCategoryEnabled(key)}
                      />
                      
                      <div className="flex flex-col gap-1 mt-2">
                        <h4 className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-2">Individual Events</h4>
                        {eventIds.map(eventId => (
                          <div key={eventId} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                            <span className="text-[13px] text-text font-medium">{EVENT_NAMES[eventId] || `Event ${eventId}`}</span>
                            <Toggle 
                              checked={config.enabledEvents.includes(eventId)} 
                              onChange={(checked) => toggleEvent(eventId, checked)} 
                            />
                          </div>
                        ))}

                        {key === 'Messages' && (
                          <>
                            <div className="flex items-center justify-between py-2 mt-2 pt-3 border-t border-border/50">
                              <div className="flex flex-col pr-4">
                                <span className="text-[13px] text-text font-medium mb-0.5">Log Text Message Deletes</span>
                                <span className="text-[11px] text-text-muted leading-snug">Log purely text messages</span>
                              </div>
                              <Toggle 
                                checked={(config.otherOptions as any)?.logTextMessageDeletes ?? true} 
                                onChange={(checked) => toggleOtherOption('logTextMessageDeletes', checked)} 
                              />
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <div className="flex flex-col pr-4">
                                <span className="text-[13px] text-text font-medium mb-0.5">Log Media Message Deletes</span>
                                <span className="text-[11px] text-text-muted leading-snug">Attach links for images/videos</span>
                              </div>
                              <Toggle 
                                checked={(config.otherOptions as any)?.logMediaMessageDeletes ?? true} 
                                onChange={(checked) => toggleOtherOption('logMediaMessageDeletes', checked)} 
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CategoryCard>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
