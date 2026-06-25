'use client';

import React from 'react';
import { TopTabs } from './TopTabs';
import Link from 'next/link';

export function DashboardLayout({ children, guildId }: { children: React.ReactNode, guildId: string }) {
  return (
    <div className="min-h-screen bg-[#0f0f11] text-[#e8e8ed] font-sans">
      {/* Top Header */}
      <header className="border-b border-[#3a3a45] bg-[#1a1a1f] px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-2xl font-black text-white hover:text-gray-300 transition-colors">
            Logger.
          </Link>
          <div className="h-6 w-px bg-[#3a3a45]" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#c336c3]/20 to-transparent border border-[#c336c3]/30">
              <div className="w-2 h-2 rounded-full bg-[#c336c3] animate-pulse" />
              <span className="text-sm font-semibold text-[#c336c3]">Logger Pro</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Mock User Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#26262d] border border-[#3a3a45] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b8b99" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <TopTabs guildId={guildId} />
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
