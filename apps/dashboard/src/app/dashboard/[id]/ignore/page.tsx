'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { GuildConfig } from '@logger/shared';
import { IconUsers, IconTarget, IconHash, IconFolderOpen, IconMessageCircle, IconShield, IconShieldCheck, IconRobot } from '@tabler/icons-react';
import { Card, TextInput, Switch, Text, Group, Stack, Grid, Title, Box, Loader, Center, Indicator, Badge } from '@mantine/core';

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
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Box style={{ flex: 1 }}>
          <Group gap="sm" mb="xs">
            <Box c="violet">
              {icon}
            </Box>
            <Title order={5}>{title}</Title>
          </Group>
          <Text size="xs" c="dimmed" lh={1.4} mb="md">{description}</Text>
        </Box>
        <Box w={300}>
          <TextInput 
            placeholder={placeholder}
            value={value.join(', ')}
            onChange={(e) => onChange(e.currentTarget.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
          />
        </Box>
      </Group>
    </Card>
  );
}

function ToggleCard({ title, description, icon, checked, onChange, isPro }: any) {
  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Box style={{ flex: 1 }}>
          <Group gap="sm" mb="xs">
            <Box c="violet">
              {icon}
            </Box>
            <Title order={5}>{title}</Title>
            {isPro && <Badge color="violet" variant="light" size="xs">PRO LITE</Badge>}
          </Group>
          <Text size="xs" c="dimmed" lh={1.4}>{description}</Text>
        </Box>
        <Switch 
          checked={checked}
          onChange={(e) => onChange(e.currentTarget.checked)}
          color="violet"
          size="md"
        />
      </Group>
    </Card>
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

  const updateList = (field: keyof GuildConfig, value: string[]) => {
    setConfig(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const updateBool = (field: keyof GuildConfig, value: boolean) => {
    setConfig(prev => prev ? { ...prev, [field]: value } : prev);
  };

  return (
    <DashboardLayout guildId={guildId}>
      <Stack mb="xl">
        <Title order={2} fw={900} tt="uppercase" lts={1}>Ignore Options</Title>
        <Text c="dimmed" size="sm" maw={600}>
          Fine-tune exactly what gets logged and what is ignored.
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

      <Stack gap="md">
        <ListCard 
          icon={<IconUsers size={20} />} title="Executors" description="Executors are the people who carry out an action on another user. (Comma separated IDs)"
          placeholder="Enter user IDs..." value={config.ignoreExecutorUsers || []} onChange={(v: string[]) => updateList('ignoreExecutorUsers', v)}
        />
        <ListCard 
          icon={<IconTarget size={20} />} title="Targets" description="Targets are people the action is done to. (Comma separated IDs)"
          placeholder="Enter user IDs..." value={config.ignoreTargetUsers || []} onChange={(v: string[]) => updateList('ignoreTargetUsers', v)}
        />
        <ListCard 
          icon={<IconHash size={20} />} title="Channels" description="Actions involving this channel are not recorded to the serverlog. (Comma separated IDs)"
          placeholder="Search for Channels..." value={config.ignoreChannels || []} onChange={(v: string[]) => updateList('ignoreChannels', v)}
        />
        <ListCard 
          icon={<IconFolderOpen size={20} />} title="Channel Categories" description="Exclude all events involving channels which belong to a particular category. (Comma separated IDs)"
          placeholder="Search for Categories..." value={config.ignoreCategories || []} onChange={(v: string[]) => updateList('ignoreCategories', v)}
        />
        <ListCard 
          icon={<IconMessageCircle size={20} />} title="Message Content" description="Messages with this exact content are not recorded to the serverlog when deleted. (Comma separated phrases)"
          placeholder="Add Message Content..." value={config.ignoreMessageContent || []} onChange={(v: string[]) => updateList('ignoreMessageContent', v)}
        />
        <ListCard 
          icon={<IconShield size={20} />} title="Role Executors" description="When a user with this role carries out an action on a target, these logs will not be recorded."
          placeholder="Search for Roles..." value={config.ignoreExecutorRoles || []} onChange={(v: string[]) => updateList('ignoreExecutorRoles', v)}
        />
        <ListCard 
          icon={<IconShieldCheck size={20} />} title="Role Targets" description="When a user with this role has an action carried out on them, these logs will not be recorded."
          placeholder="Search for Roles..." value={config.ignoreRoles || []} onChange={(v: string[]) => updateList('ignoreRoles', v)}
        />
        <ToggleCard
          icon={<IconRobot size={20} />} title="Bot Executors" description="Enabled means when an action is carried out BY a bot, it will not be logged."
          isPro={true} checked={config.ignoreBotExecutors} onChange={(v: boolean) => updateBool('ignoreBotExecutors', v)}
        />
        <ToggleCard
          icon={<IconRobot size={20} />} title="Bot Targets" description="Enabled means when an action is carried out ON a bot, it will not be logged."
          isPro={true} checked={config.ignoreBotTargets} onChange={(v: boolean) => updateBool('ignoreBotTargets', v)}
        />
      </Stack>
    </DashboardLayout>
  );
}
