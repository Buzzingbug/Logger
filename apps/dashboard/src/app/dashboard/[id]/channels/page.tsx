'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { EVENT_CATEGORIES, EVENT_NAMES, GuildConfig } from '@logger/shared';
import { IconShield, IconUser, IconMessageCircle, IconMicrophone, IconActivity, IconFile, IconServer, IconShieldCheck, IconHash, IconSettings } from '@tabler/icons-react';
import { Card, Select, Switch, Text, Group, Stack, Grid, Title, Divider, Box, Loader, Center, Indicator } from '@mantine/core';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const CATEGORY_META: Record<string, { title: string, desc: string, icon: React.ReactNode }> = {
  Modlogs: { title: 'Modlogs', desc: 'Log moderative actions like bans, kicks, and timeouts.', icon: <IconShield size={20} /> },
  Members: { title: 'Members', desc: 'Log member joins, leaves, and profile updates.', icon: <IconUser size={20} /> },
  Messages: { title: 'Messages', desc: 'Log message edits, deletions, and pinned messages.', icon: <IconMessageCircle size={20} /> },
  Voice: { title: 'Voice', desc: 'Log voice channel joins, leaves, and activity.', icon: <IconMicrophone size={20} /> },
  Actions: { title: 'Actions', desc: 'Log server action events.', icon: <IconActivity size={20} /> },

  Server: { title: 'Server', desc: 'Log server property updates.', icon: <IconServer size={20} /> },
  Roles: { title: 'Roles', desc: 'Log role creation, edits, and deletions.', icon: <IconShieldCheck size={20} /> },
  Channels: { title: 'Channels', desc: 'Log channel creation, edits, and deletions.', icon: <IconHash size={20} /> },
  Internal: { title: 'Logger Events', desc: 'Log internal Logger system events.', icon: <IconSettings size={20} /> },
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

  if (!config) return (
    <DashboardLayout guildId={guildId}>
      <Center mt={100}>
        <Stack align="center">
          <Loader color="violet" type="bars" />
          <Text c="dimmed">Loading configuration...</Text>
        </Stack>
      </Center>
    </DashboardLayout>
  );

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

  const handleChannelChange = (category: string, channelId: string | null) => {
    if (!channelId) return;
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
      <Stack mb="xl">
        <Title order={2} fw={900} tt="uppercase" lts={1}>Channels Configuration</Title>
        <Text c="dimmed" size="sm" maw={600}>
          Configure channel-specific logging settings for different server activities. Events will be logged to these channels when they occur.
        </Text>
      </Stack>
      
      <Group justify="flex-end" mb="md" h={24}>
        {savedStatus === 'saving' && (
          <Group gap="xs">
            <Loader size="xs" color="yellow" type="dots" />
            <Text size="sm" c="yellow" fw={700}>Saving changes...</Text>
          </Group>
        )}
        {savedStatus === 'saved' && (
          <Group gap="xs">
            <Indicator size={8} color="teal" />
            <Text size="sm" c="teal" fw={700}>All changes saved</Text>
          </Group>
        )}
      </Group>

      <Stack gap="xl">
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Group mb="md">
            <Box w={4} h={24} bg="violet" style={{ borderRadius: 4 }} />
            <Title order={4}>Main Serverlog Channel</Title>
          </Group>
          <Select 
            value={config.channelRoutes['main'] || null} 
            onChange={val => handleChannelChange('main', val)}
            data={channelOptions} 
            placeholder="Select channel"
            searchable
            clearable
          />
        </Card>

        <Grid>
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const eventIds = EVENT_CATEGORIES[key as keyof typeof EVENT_CATEGORIES] || [];
            const enabled = isCategoryEnabled(key);

            return (
              <Grid.Col key={key} span={{ base: 12, lg: 6, xl: 4 }}>
                <Card shadow="sm" p="lg" radius="md" withBorder h="100%">
                  <Group justify="space-between" align="flex-start" mb="md">
                    <Box style={{ flex: 1 }}>
                      <Group gap="sm" mb="xs">
                        <Box c={enabled ? 'violet' : 'dimmed'} style={{ transition: 'color 0.2s' }}>
                          {meta.icon}
                        </Box>
                        <Title order={5}>{meta.title}</Title>
                      </Group>
                      <Text size="xs" c="dimmed" lh={1.4}>{meta.desc}</Text>
                    </Box>
                    <Switch 
                      checked={enabled} 
                      onChange={(e) => toggleCategory(key, e.currentTarget.checked)}
                      color="violet"
                      size="md"
                    />
                  </Group>

                  {enabled && (
                    <Box mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
                      <Select 
                        value={config.channelRoutes[key] || null} 
                        onChange={val => handleChannelChange(key, val)}
                        data={channelOptions} 
                        placeholder="Inherit main channel"
                        searchable
                        clearable
                        mb="md"
                      />
                      
                      <Card withBorder bg="dark.7" p="md" radius="sm">
                        <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">Individual Events</Text>
                        <Stack gap="xs">
                          {eventIds.map(eventId => (
                            <Group key={eventId} justify="space-between" wrap="nowrap">
                              <Text size="sm" fw={500}>{EVENT_NAMES[eventId] || `Event ${eventId}`}</Text>
                              <Switch 
                                checked={config.enabledEvents.includes(eventId)} 
                                onChange={(e) => toggleEvent(eventId, e.currentTarget.checked)} 
                                color="violet"
                                size="sm"
                              />
                            </Group>
                          ))}
                        </Stack>

                        {key === 'Messages' && (
                          <Box mt="md">
                            <Divider my="sm" />
                            <Stack gap="xs">
                              <Group justify="space-between" wrap="nowrap">
                                <Box>
                                  <Text size="sm" fw={500}>Log Text Message Deletes</Text>
                                  <Text size="xs" c="dimmed">Log purely text messages</Text>
                                </Box>
                                <Switch 
                                  checked={(config.otherOptions as any)?.logTextMessageDeletes ?? true} 
                                  onChange={(e) => toggleOtherOption('logTextMessageDeletes', e.currentTarget.checked)} 
                                  color="violet"
                                  size="sm"
                                />
                              </Group>
                              <Group justify="space-between" wrap="nowrap">
                                <Box>
                                  <Text size="sm" fw={500}>Log Media Message Deletes</Text>
                                  <Text size="xs" c="dimmed">Attach links for images/videos</Text>
                                </Box>
                                <Switch 
                                  checked={(config.otherOptions as any)?.logMediaMessageDeletes ?? true} 
                                  onChange={(e) => toggleOtherOption('logMediaMessageDeletes', e.currentTarget.checked)} 
                                  color="violet"
                                  size="sm"
                                />
                              </Group>
                            </Stack>
                          </Box>
                        )}
                      </Card>
                    </Box>
                  )}
                </Card>
              </Grid.Col>
            );
          })}
        </Grid>
      </Stack>
    </DashboardLayout>
  );
}
