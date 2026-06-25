import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { id: guildId } = await params;

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      },
      next: { revalidate: 60 } // Cache for 60 seconds to prevent rate limits
    });
    
    if (!res.ok) throw new Error('Failed to fetch channels from Discord');
    
    const channels = await res.json();
    
    // Filter to only text-like channels (type 0 = Text, 2 = Voice, 4 = Category, 5 = Announcement)
    // Actually, let's return them all and let the frontend filter
    return NextResponse.json(channels);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
