'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { GuildConfig } from '@logger/shared';
import { Card, Select, Switch, Text, Group, Stack, Title, Box, Loader, Center, Indicator, Divider, ThemeIcon } from '@mantine/core';
import { IconBox } from '@tabler/icons-react';

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
      <Stack mb="xl">
        <Title order={2} fw={900} tt="uppercase" lts={1}>Other Options</Title>
        <Text c="dimmed" size="sm" maw={600}>
          Miscellaneous settings and integrations.
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

      <Card shadow="sm" p="xl" radius="md" withBorder>
        
        {/* SPOILERS */}
        <Box mb="xl">
          <Title order={5} tt="uppercase" lts={1} mb="xs">Spoilers</Title>
          <Text size="sm" c="dimmed" mb="md">Enable and spoilers are applied to media sent to the serverlogs</Text>
          <Switch 
            checked={getOther('spoilers', false)} 
            onChange={e => updateOther('spoilers', e.currentTarget.checked)} 
            color="violet"
            size="md"
          />
        </Box>

        <Divider my="xl" />

        {/* BUTTONS */}
        <Box mb="xl">
          <Title order={5} tt="uppercase" lts={1} mb="xs">Buttons</Title>
          <Text size="sm" c="dimmed" mb="md">Toggle which buttons are included with each log</Text>
          <Select 
            value={getOther('buttons', 'all')} 
            onChange={val => updateOther('buttons', val)}
            data={[
              { value: 'all', label: 'All Event Buttons' },
              { value: 'none', label: 'No Event Buttons' },
              { value: 'important', label: 'Important Only' }
            ]}
            maw={300}
          />
        </Box>

        <Divider my="xl" />

        {/* FORMAT */}
        <Box mb="xl">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Box>
              <Title order={5} mb="xs">Embed Format</Title>
              <Text size="sm" c="dimmed">Change the visual style of log embeds</Text>
            </Box>
            <Select 
              value={getOther('format', 'standard')} 
              onChange={val => updateOther('format', val)}
              data={[
                { value: 'standard', label: 'Standard (Default)' },
                { value: 'compact', label: 'Compact' },
                { value: 'detailed', label: 'Detailed (Pro)' }
              ]}
              w={250}
            />
          </Group>
        </Box>

        <Divider my="xl" />

        {/* BOT INTEGRATIONS */}
        <Box>
          <Title order={5} tt="uppercase" lts={1} mb="lg">Bot Integrations</Title>
          
          <Group justify="space-between" wrap="nowrap">
            <Group gap="md">
              <ThemeIcon size="lg" variant="light" color="violet">
                <IconBox size={20} />
              </ThemeIcon>
              <Box>
                <Title order={6}>PluralKit Compatibility</Title>
                <Text size="sm" c="dimmed">Automatically handle PluralKit interactions without cluttering up the logs</Text>
              </Box>
            </Group>
            <Switch 
              checked={getOther('pluralkit', false)} 
              onChange={e => updateOther('pluralkit', e.currentTarget.checked)} 
              color="violet"
              size="md"
            />
          </Group>
        </Box>

      </Card>
    </DashboardLayout>
  );
}
