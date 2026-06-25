'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Toggle } from '../../../../components/Toggle';
import { EVENT_CATEGORIES, GuildConfig } from '@logger/shared';

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ChannelsPage({ params }: { params: Promise<{ id: string }> }) {
  const [config, setConfig] = useState<GuildConfig | null>(null);
  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [guildId, setGuildId] = useState<string>('');

  useEffect(() => {
    params.then(p => {
      setGuildId(p.id);
      fetch(`/api/guilds/${p.id}/config`)
        .then(r => r.json())
        .then(data => setConfig(data));
    });
  }, [params]);

  const debouncedConfig = useDebounce(config, 800);

  // Auto-save on config change
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

  if (!config) return <div style={{ color: 'white' }}>Loading...</div>;

  const toggleEvent = (eventId: number) => {
    setConfig(prev => {
      if (!prev) return prev;
      const enabled = prev.enabledEvents.includes(eventId);
      return {
        ...prev,
        enabledEvents: enabled 
          ? prev.enabledEvents.filter(id => id !== eventId)
          : [...prev.enabledEvents, eventId]
      };
    });
  };

  return (
    <DashboardLayout guildId={guildId}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h1 style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Channels & Events</h1>
        {savedStatus === 'saving' && <span style={{ color: 'var(--color-warning)' }}>Saving...</span>}
        {savedStatus === 'saved' && <span style={{ color: 'var(--color-success)' }}>Saved ✓</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Object.entries(EVENT_CATEGORIES).map(([category, events]) => (
          <div key={category} style={{ background: 'var(--color-surface-2)', padding: 20, borderRadius: 12 }}>
            <h2 style={{ color: 'white', marginBottom: 15 }}>{category}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {events.map(eventId => (
                <div key={eventId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text)' }}>Event #{eventId}</span>
                  <Toggle 
                    checked={config.enabledEvents.includes(eventId)} 
                    onChange={() => toggleEvent(eventId)} 
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
