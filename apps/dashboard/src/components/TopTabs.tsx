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
    <div className="flex bg-[#1c1c22] border border-[#2c2c35] rounded-lg mb-8 overflow-hidden shadow-sm">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <Link
            key={tab.name}
            href={tab.path}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-center border-r border-[#2c2c35] last:border-r-0 ${
              isActive
                ? 'bg-[#8a2571] text-white shadow-inner'
                : 'text-[#8b8b99] hover:text-[#e8e8ed] hover:bg-[#26262d]'
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
