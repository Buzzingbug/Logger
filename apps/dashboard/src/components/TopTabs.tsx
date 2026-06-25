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
    <div className="flex space-x-2 border border-[#3a3a45] rounded-xl p-1 bg-[#1a1a1f] mb-8 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <Link
            key={tab.name}
            href={tab.path}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              isActive
                ? 'bg-gradient-to-r from-[#c336c3] to-[#8a248a] text-white shadow-lg'
                : 'text-[#8b8b99] hover:text-white hover:bg-[#26262d]'
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
