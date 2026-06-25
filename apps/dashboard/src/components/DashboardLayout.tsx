'use client';

import React from 'react';
import { Sidebar } from './Sidebar';

export function DashboardLayout({ children, guildId }: { children: React.ReactNode, guildId: string }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Sidebar guildId={guildId} />
      <main style={{ flex: 1, padding: 40 }}>
        {children}
      </main>
    </div>
  );
}
