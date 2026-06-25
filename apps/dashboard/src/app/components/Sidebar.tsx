'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings2, ShieldOff, ServerCog, Menu, X } from 'lucide-react';
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
      <div className="p-4 flex flex-col gap-2 flex-grow">
        <div className="text-xs font-black tracking-widest text-text-muted mb-2 uppercase px-3 pt-2">
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
                  ? 'bg-accent/10 text-accent border border-accent-glow shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  : 'text-text-muted border border-transparent hover:text-text hover:bg-surface/50'
              }`}
            >
              <Icon size={18} className={`${isActive ? 'text-accent' : 'text-text-muted group-hover:text-text'} transition-colors`} />
              {link.name}
            </Link>
          );
        })}
      </div>
      
      {/* Premium Badge area at bottom of sidebar */}
      <div className="p-4 mt-auto border-t border-border md:border-t-0">
        <div className="bg-gradient-to-br from-surface to-surface-2 rounded-xl p-4 border border-border">
          <div className="text-sm font-semibold text-text mb-1">Need help?</div>
          <div className="text-xs text-text-muted mb-3">Join our support server for quick assistance.</div>
          <button className="w-full bg-surface-2 hover:bg-surface border-border text-text text-sm font-medium py-2 rounded-lg transition-colors border">
            Support Server
          </button>
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
