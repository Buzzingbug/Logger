'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export function DashboardLayout({ children, guildId }: { children: React.ReactNode, guildId: string }) {
  return (
    <div className="min-h-screen bg-bg text-text font-sans flex flex-col overflow-x-hidden">
      {/* Top Header */}
      <header className="border-b border-border bg-bg/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-50 h-[73px]">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="text-xl sm:text-2xl font-black text-text hover:text-white transition-colors spring-transition">
            Logger.
          </Link>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-accent-glow shadow-[0_0_10px_rgba(59,130,246,0.1)]">
            <ShieldCheck size={14} className="text-accent animate-pulse" />
            <span className="text-xs font-bold tracking-wide text-accent uppercase">Logger Pro</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Mock User Avatar */}
          <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors spring-transition overflow-hidden">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <div className="flex flex-1 flex-col md:flex-row relative">
        <Sidebar guildId={guildId} />
        
        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
