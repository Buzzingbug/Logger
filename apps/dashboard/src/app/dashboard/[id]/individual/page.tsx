'use client';

import React from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { Stack, Title, Text, Center, Card } from '@mantine/core';
import { IconLayoutSidebarRight } from '@tabler/icons-react';

export default function IndividualOptionsPage({ params }: { params: Promise<{ id: string }> }) {
  const [guildId, setGuildId] = React.useState<string>('');

  React.useEffect(() => {
    params.then(p => setGuildId(p.id));
  }, [params]);

  return (
    <DashboardLayout guildId={guildId}>
      <Stack mb="xl">
        <Title order={2} fw={900} tt="uppercase" lts={1}>Individual Log Config</Title>
        <Text c="dimmed" size="sm" maw={600}>
          Configure granular settings for individual log events.
        </Text>
      </Stack>

      <Card shadow="sm" p="xl" radius="md" withBorder>
        <Center mih={300}>
          <Stack align="center" gap="md">
            <IconLayoutSidebarRight size={48} stroke={1.5} color="var(--mantine-color-dimmed)" />
            <Title order={3}>Coming Soon</Title>
            <Text c="dimmed" maw={400} ta="center">
              Individual log configuration is currently being rolled out to Logger Pro users. Check back soon for updates!
            </Text>
          </Stack>
        </Center>
      </Card>
    </DashboardLayout>
  );
}
