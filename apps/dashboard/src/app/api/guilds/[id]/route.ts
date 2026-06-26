import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: guildId } = await params;
  const botToken = process.env.DISCORD_TOKEN;

  if (!botToken) {
    return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch guild' }, { status: res.status });
    }

    const data = await res.json();
    
    return NextResponse.json({
      id: data.id,
      name: data.name,
      icon: data.icon ? `https://cdn.discordapp.com/icons/${data.id}/${data.icon}.png` : null,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
