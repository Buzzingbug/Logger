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
    <div className="flex gap-2 border border-[#3a3a45] rounded-2xl p-1.5 bg-[#1a1a1f] mb-8 overflow-x-auto w-max max-w-full shadow-sm">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <Link
            key={tab.name}
            href={tab.path}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center ${
              isActive
                ? 'bg-[#c336c3] text-white shadow-md'
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
