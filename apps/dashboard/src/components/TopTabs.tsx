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
    <div className="flex bg-[#09090b] border border-[#27272a] rounded-lg mb-8 overflow-hidden shadow-sm">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <Link
            key={tab.name}
            href={tab.path}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-center border-r border-[#27272a] last:border-r-0 ${
              isActive
                ? 'bg-[#18181b] text-[#e4e4e7] shadow-inner'
                : 'text-[#a1a1aa] hover:text-[#e4e4e7] hover:bg-[#18181b]/50'
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
