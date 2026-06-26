'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { EVENT_CATEGORIES, EVENT_NAMES, GuildConfig } from '@logger/shared';
import { Card, Switch, Text, Group, Stack, Grid, Title, Box, Loader, Center, Indicator, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function IndividualOptionsPage({ params }: { params: Promise<{ id: string }> }) {
  const [config, setConfig] = useState<GuildConfig | null>(null);
  const [guildId, setGuildId] = useState<string>('');
  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [searchQuery, setSearchQuery] = useState('');

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

  const toggleEvent = (eventId: number, enabled: boolean) => {
    setConfig(prev => {
      if (!prev) return prev;
      let newEvents = new Set(prev.enabledEvents);
      if (enabled) newEvents.add(eventId);
      else newEvents.delete(eventId);
      return { ...prev, enabledEvents: Array.from(newEvents) };
    });
  };

  const filteredCategories = Object.entries(EVENT_CATEGORIES).map(([category, eventIds]) => {
    const matchingEvents = eventIds.filter(id => 
      (EVENT_NAMES[id] || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { category, events: matchingEvents };
  }).filter(c => c.events.length > 0);

  return (
    <DashboardLayout guildId={guildId}>
      <Stack mb="xl">
        <Title order={2} fw={900} tt="uppercase" lts={1}>Individual Log Config</Title>
        <Text c="dimmed" size="sm" maw={600}>
          Configure granular settings for individual log events. Turn specific log events on or off across your server.
        </Text>
      </Stack>

      <Group justify="space-between" mb="xl">
        <TextInput
          placeholder="Search events..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          w={{ base: '100%', sm: 300 }}
          radius="md"
        />
        
        <Box h={24}>
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
        </Box>
      </Group>

      <Grid>
        {filteredCategories.map(({ category, events }) => (
          <Grid.Col key={category} span={{ base: 12, md: 6, xl: 4 }}>
            <Card shadow="sm" p="lg" radius="md" withBorder h="100%">
              <Title order={4} mb="md" c="violet.4">{category}</Title>
              <Stack gap="sm">
                {events.map(eventId => (
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
            </Card>
          </Grid.Col>
        ))}
        {filteredCategories.length === 0 && (
          <Grid.Col span={12}>
            <Center py="xl">
              <Text c="dimmed">No events found matching your search.</Text>
            </Center>
          </Grid.Col>
        )}
      </Grid>
    </DashboardLayout>
  );
}
