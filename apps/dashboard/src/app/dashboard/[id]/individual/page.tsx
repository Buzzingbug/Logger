'use client';

import React from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';

export default function IndividualOptionsPage({ params }: { params: Promise<{ id: string }> }) {
  const [guildId, setGuildId] = React.useState<string>('');

  React.useEffect(() => {
    params.then(p => setGuildId(p.id));
  }, [params]);

  return (
    <DashboardLayout guildId={guildId}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-2">INDIVIDUAL LOG CONFIG</h2>
          <p className="text-[#8b8b99] text-sm">Configure granular settings for individual log events.</p>
        </div>
      </div>

      <div className="bg-[#18181b]/50 p-8 rounded-xl border border-[#27272a] flex flex-col items-center justify-center min-h-[300px]">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
        <h3 className="text-xl font-bold text-[#e4e4e7] mb-2">Coming Soon</h3>
        <p className="text-[#a1a1aa] max-w-md text-center">
          Individual log configuration is currently being rolled out to Logger Pro users. Check back soon for updates!
        </p>
      </div>
    </DashboardLayout>
  );
}
