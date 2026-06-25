'use client';

import React from 'react';
import { TopTabs } from './TopTabs';
import Link from 'next/link';

export function DashboardLayout({ children, guildId }: { children: React.ReactNode, guildId: string }) {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#e4e4e7] font-sans">
      {/* Top Header */}
      <header className="border-b border-[#27272a] bg-[#09090b] px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="text-xl sm:text-2xl font-black text-[#e4e4e7] hover:text-white transition-colors">
            Logger.
          </Link>
          <div className="h-6 w-px bg-[#27272a]" />
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-[#3b82f6]/20 to-transparent border border-[#3b82f6]/30">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#3b82f6] animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold text-[#3b82f6]">Logger Pro</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Mock User Avatar */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center cursor-pointer hover:bg-[#27272a] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <TopTabs guildId={guildId} />
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
