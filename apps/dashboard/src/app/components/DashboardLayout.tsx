'use client';

import React, { useEffect, useState } from 'react';
import { AppShell, Burger, Group, Text, NavLink, Box, Button, Card, Avatar, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLayoutDashboard, IconSettings, IconShieldOff, IconServerCog, IconCrown, IconSearch, IconBell, IconHelp, IconSparkles } from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export function DashboardLayout({ children, guildId }: { children: React.ReactNode, guildId: string }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();
  
  const { data: session } = useSession();
  const [guildInfo, setGuildInfo] = useState<{ name: string, icon: string | null } | null>(null);

  useEffect(() => {
    if (guildId) {
      fetch(`/api/guilds/${guildId}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setGuildInfo(data);
          }
        })
        .catch(console.error);
    }
  }, [guildId]);

  const links = [
    { name: 'Channels', path: `/dashboard/${guildId}/channels`, icon: IconLayoutDashboard },
    { name: 'Ignore Options', path: `/dashboard/${guildId}/ignore`, icon: IconShieldOff },
    { name: 'Individual Config', path: `/dashboard/${guildId}/individual`, icon: IconSettings },
    { name: 'Other Options', path: `/dashboard/${guildId}/other`, icon: IconServerCog },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="sm">
              <Box bg="violet.9" c="white" p={6} style={{ borderRadius: 8 }}>
                {guildInfo?.icon ? (
                  <Avatar src={guildInfo.icon} size={28} radius="sm" />
                ) : (
                  <Text fw={900} size="sm">
                    {guildInfo?.name ? guildInfo.name.substring(0, 2).toUpperCase() : 'PP'}
                  </Text>
                )}
              </Box>
              <Box>
                <Text fw={700} size="sm" lh={1}>{guildInfo?.name || 'Loading...'}</Text>
                <Text size="xs" c="dimmed">Server</Text>
              </Box>
            </Group>
          </Group>

          <Group visibleFrom="sm">
            <TextInput
              placeholder="Search anything..."
              leftSection={<IconSearch size={16} />}
              radius="xl"
              w={300}
              variant="filled"
              styles={{
                input: { backgroundColor: 'var(--mantine-color-dark-6)' }
              }}
            />
          </Group>

          <Group gap="md">
            <IconBell size={20} color="gray" />
            <IconHelp size={20} color="gray" />
            <Group gap="xs" visibleFrom="xs">
              <Box ta="right">
                <Text size="sm" fw={700} lh={1}>{session?.user?.name || 'Loading...'}</Text>
                <Text size="xs" c="dimmed">Administrator</Text>
              </Box>
              <Avatar src={session?.user?.image || undefined} radius="xl" color="violet" />
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Group mb="md" px="xs">
          <Image 
            src="/logo.jpg" 
            alt="Logger Logo" 
            width={32} 
            height={32} 
            style={{ borderRadius: '50%', objectFit: 'cover' }} 
          />
          <Text fw={900} size="xl" lts={2}>LOGGER</Text>
        </Group>
        
        <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="sm" px="xs">Configuration</Text>
        
        {links.map((link) => (
          <NavLink
            key={link.name}
            href={link.path}
            label={link.name}
            leftSection={<link.icon size={18} stroke={1.5} />}
            active={pathname.startsWith(link.path)}
            onClick={(e) => {
              e.preventDefault();
              router.push(link.path);
              if (opened) toggle();
            }}
            variant="filled"
            style={{ borderRadius: 8, marginBottom: 4 }}
          />
        ))}

        <Box mt="auto">
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Group gap="xs" mb="xs">
              <IconCrown size={20} color="gold" />
              <Text fw={700} size="sm">Upgrade to Premium</Text>
            </Group>
            <Text size="xs" c="dimmed" mb="md">
              Unlock powerful features and advanced security.
            </Text>
            <Button variant="light" color="violet" fullWidth radius="md">
              Upgrade Now
            </Button>
          </Card>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
