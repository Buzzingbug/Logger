'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import Link from 'next/link';
import { Search, Bell, HelpCircle, Sun, Moon } from 'lucide-react';

export function DashboardLayout({ children, guildId }: { children: React.ReactNode, guildId: string }) {
  return (
    <div className="min-h-screen bg-bg text-text font-sans flex flex-col overflow-x-hidden">
      <header className="border-b border-border bg-bg/95 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-50 h-[73px]">
        
        {/* Left: Server Selector Mock */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 bg-surface border border-border px-4 py-2 rounded-xl cursor-pointer hover:border-accent/50 spring-transition">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold">
              PP
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-text leading-none mb-1">Paradise Prime</span>
              <span className="text-[10px] font-medium text-text-muted leading-none">Server</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-success ml-4"></div>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="w-full bg-surface border border-border rounded-xl py-2 pl-9 pr-4 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 spring-transition"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-bg border border-border rounded text-[10px] font-mono text-text-muted">⌘</kbd>
              <kbd className="px-1.5 py-0.5 bg-bg border border-border rounded text-[10px] font-mono text-text-muted">K</kbd>
            </div>
          </div>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex items-center gap-4 text-text-muted">
            <button className="relative hover:text-text spring-transition">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-[9px] font-bold text-white flex items-center justify-center border-2 border-bg">3</span>
            </button>
            <button className="hover:text-text spring-transition"><HelpCircle size={20} /></button>
            <button className="hover:text-text spring-transition"><Sun size={20} /></button>
          </div>
          
          <div className="h-6 w-px bg-border hidden sm:block" />

          {/* Profile */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-text group-hover:text-accent spring-transition leading-none mb-1">Prime Admin</span>
              <span className="text-[10px] font-medium text-text-muted leading-none">Administrator</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-2 border-2 border-border group-hover:border-accent spring-transition overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=PrimeAdmin&backgroundColor=6D28D9" alt="User Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* Main App Container */}
      <div className="flex flex-1 flex-col md:flex-row relative">
        <Sidebar guildId={guildId} />
        
        {/* Main Content Area */}
        <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
