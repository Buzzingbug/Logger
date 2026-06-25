'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TopTabs({ guildId }: { guildId: string }) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Channels', path: `/dashboard/${guildId}/channels` },
    { name: 'Ignore Options', path: `/dashboard/${guildId}/ignore` },
    { name: 'Other', path: `/dashboard/${guildId}/other` },
    { name: 'Individual Log Config', path: `/dashboard/${guildId}/individual` },
  ];

  return (
    <div className="relative mb-8">
      {/* Fade gradients for scroll indication on mobile */}
      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#09090b] to-transparent z-10 pointer-events-none md:hidden" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#09090b] to-transparent z-10 pointer-events-none md:hidden" />
      
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x">
        {tabs.map((tab) => {
          const isActive = pathname.replace(/\/$/, '') === tab.path.replace(/\/$/, '');
          return (
            <Link
              key={tab.name}
              href={tab.path}
              className={`snap-start whitespace-nowrap px-4 py-2 text-sm font-semibold transition-all rounded-full border ${
                isActive
                  ? 'bg-[#3b82f6]/10 text-white border-[#3b82f6]/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                  : 'text-[#a1a1aa] bg-transparent border-transparent hover:text-[#e4e4e7] hover:bg-[#18181b]/50'
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
