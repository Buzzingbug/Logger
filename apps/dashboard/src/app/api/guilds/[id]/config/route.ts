import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { prisma, redis } from '@logger/db';
import { GuildConfig } from '@logger/shared';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Wait for params in Next.js 15+
  const { id: guildId } = await params;

  // In a real app, verify via Discord API that the user has 'Manage Server' in this guild!
  
  let config = await prisma.guildConfig.findUnique({
    where: { guildId }
  });

  if (!config) {
    // Return default config
    return NextResponse.json({
      guildId,
      enabledEvents: [],
      ignoreTargetUsers: [],
      ignoreExecutorUsers: [],
      ignoreRoles: [],
      ignoreChannels: [],
      channelRoutes: {},
      embedColors: {}
    });
  }

  return NextResponse.json(config);
}

export async function POST(req: any, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: guildId } = await params;
  const body: Partial<GuildConfig> = await req.json();

  // In a real app, verify user has 'Manage Server'

  const config = await prisma.guildConfig.upsert({
    where: { guildId },
    update: {
      enabledEvents: body.enabledEvents,
      ignoreTargetUsers: body.ignoreTargetUsers,
      ignoreExecutorUsers: body.ignoreExecutorUsers,
      ignoreRoles: body.ignoreRoles,
      ignoreChannels: body.ignoreChannels,
      channelRoutes: body.channelRoutes,
      embedColors: body.embedColors,
    },
    create: {
      guildId,
      enabledEvents: body.enabledEvents || [],
      ignoreTargetUsers: body.ignoreTargetUsers || [],
      ignoreExecutorUsers: body.ignoreExecutorUsers || [],
      ignoreRoles: body.ignoreRoles || [],
      ignoreChannels: body.ignoreChannels || [],
      channelRoutes: body.channelRoutes || {},
      embedColors: body.embedColors || {},
    }
  });

  // Invalidate Redis cache so the bot instantly picks up changes
  await redis.del(`config:${guildId}`);

  return NextResponse.json({ success: true, config });
}
