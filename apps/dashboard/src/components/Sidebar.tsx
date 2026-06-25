'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar({ guildId }: { guildId: string }) {
  const pathname = usePathname();

  const links = [
    { label: 'Channels', path: `/dashboard/${guildId}/channels` },
    { label: 'Ignore Options', path: `/dashboard/${guildId}/ignore` },
    { label: 'Integrations', path: `/dashboard/${guildId}/integrations` },
    { label: 'Appearance', path: `/dashboard/${guildId}/appearance` },
    { label: 'Danger Zone', path: `/dashboard/${guildId}/danger`, color: 'var(--color-danger)' },
  ];

  return (
    <div style={{ width: 260, background: 'var(--color-surface)', height: '100vh', padding: 20, borderRight: '1px solid var(--color-border)' }}>
      <h2 style={{ marginBottom: 20, color: 'var(--color-text)' }}>Server Settings</h2>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map(link => {
          const isActive = pathname === link.path;
          return (
            <Link
              key={link.path}
              href={link.path}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                textDecoration: 'none',
                color: link.color || (isActive ? 'white' : 'var(--color-text-muted)'),
                background: isActive ? 'var(--color-surface-3)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                transition: 'background 0.2s'
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
