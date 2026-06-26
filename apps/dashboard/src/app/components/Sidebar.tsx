'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings2, ShieldOff, ServerCog, Menu, X, Crown, Sparkles } from 'lucide-react';
import { useState } from 'react';

export function Sidebar({ guildId }: { guildId: string }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { name: 'Channels', path: `/dashboard/${guildId}/channels`, icon: LayoutDashboard },
    { name: 'Ignore Options', path: `/dashboard/${guildId}/ignore`, icon: ShieldOff },
    { name: 'Individual Config', path: `/dashboard/${guildId}/individual`, icon: Settings2 },
    { name: 'Other Options', path: `/dashboard/${guildId}/other`, icon: ServerCog },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-bg md:bg-transparent">
      
      {/* Sidebar Header / Logo */}
      <div className="hidden md:flex items-center gap-3 p-6 mb-2">
        <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_20px_var(--color-accent-glow)]">
          <Sparkles size={18} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-wide text-text uppercase">LOGGER</span>
      </div>

      <div className="px-4 flex flex-col gap-2 flex-grow">
        <div className="text-[10px] font-bold tracking-widest text-text-muted mb-2 uppercase px-3 pt-2">
          Configuration
        </div>
        {links.map((link) => {
          const isActive = pathname.replace(/\/$/, '') === link.path.replace(/\/$/, '');
          const Icon = link.icon;
          
          return (
            <Link
              key={link.name}
              href={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all spring-transition group ${
                isActive
                  ? 'bg-accent/15 text-accent border border-accent/30 shadow-[0_0_15px_rgba(124,58,237,0.15)]'
                  : 'text-text-muted border border-transparent hover:text-text hover:bg-surface-2'
              }`}
            >
              <Icon size={18} className={`${isActive ? 'text-accent' : 'text-text-muted group-hover:text-text'} transition-colors`} />
              {link.name}
            </Link>
          );
        })}
      </div>
      
      {/* Premium Badge area at bottom of sidebar */}
      <div className="p-4 mt-auto">
        <div className="relative rounded-2xl p-5 overflow-hidden group cursor-pointer card-glow">
          <div className="absolute inset-0 bg-gradient-to-br from-accent to-accent-secondary opacity-100 transition-opacity group-hover:opacity-90"></div>
          <div className="relative z-10">
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
              <Crown size={16} className="text-[#FFB800]" />
            </div>
            <div className="text-sm font-bold text-white mb-1">Upgrade to Premium</div>
            <div className="text-[11px] text-white/80 leading-relaxed mb-4">
              Unlock powerful features and advanced security.
            </div>
            <button className="w-full bg-white text-accent hover:bg-white/90 text-xs font-bold py-2 rounded-xl transition-colors shadow-lg">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle & Menu */}
      <div className="md:hidden w-full border-b border-border bg-bg p-4 sticky top-[73px] z-30 flex items-center justify-between">
        <span className="font-semibold text-text">Menu</span>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-surface rounded-lg border border-border text-text-muted hover:text-text transition-colors"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Sidebar Content */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[138px] z-40 bg-bg md:hidden animate-in fade-in duration-200">
          <SidebarContent />
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-64 flex-shrink-0 hidden md:block border-r border-border bg-bg/50 backdrop-blur-xl h-[calc(100vh-73px)] sticky top-[73px] z-30">
        <SidebarContent />
      </aside>
    </>
  );
}
