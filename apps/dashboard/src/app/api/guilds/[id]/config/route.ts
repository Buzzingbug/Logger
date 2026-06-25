import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { prisma, redis } from '@logger/db';
import { GuildConfig } from '@logger/shared';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: guildId } = await params;

  let config = await prisma.guildConfig.findUnique({
    where: { guildId }
  });

  if (!config) {
    return NextResponse.json({
      guildId,
      enabledEvents: [],
      ignoreTargetUsers: [],
      ignoreExecutorUsers: [],
      ignoreRoles: [],
      ignoreChannels: [],
      ignoreCategories: [],
      ignoreMessageContent: [],
      ignoreExecutorRoles: [],
      ignoreBotExecutors: false,
      ignoreBotTargets: false,
      channelRoutes: {},
      embedColors: {},
      otherOptions: {}
    });
  }

  return NextResponse.json(config);
}

export async function POST(req: any, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: guildId } = await params;
  const body: Partial<GuildConfig> = await req.json();

  const config = await prisma.guildConfig.upsert({
    where: { guildId },
    update: {
      enabledEvents: body.enabledEvents,
      ignoreTargetUsers: body.ignoreTargetUsers,
      ignoreExecutorUsers: body.ignoreExecutorUsers,
      ignoreRoles: body.ignoreRoles,
      ignoreChannels: body.ignoreChannels,
      ignoreCategories: body.ignoreCategories,
      ignoreMessageContent: body.ignoreMessageContent,
      ignoreExecutorRoles: body.ignoreExecutorRoles,
      ignoreBotExecutors: body.ignoreBotExecutors,
      ignoreBotTargets: body.ignoreBotTargets,
      channelRoutes: body.channelRoutes,
      embedColors: body.embedColors,
      otherOptions: body.otherOptions,
    },
    create: {
      guildId,
      enabledEvents: body.enabledEvents || [],
      ignoreTargetUsers: body.ignoreTargetUsers || [],
      ignoreExecutorUsers: body.ignoreExecutorUsers || [],
      ignoreRoles: body.ignoreRoles || [],
      ignoreChannels: body.ignoreChannels || [],
      ignoreCategories: body.ignoreCategories || [],
      ignoreMessageContent: body.ignoreMessageContent || [],
      ignoreExecutorRoles: body.ignoreExecutorRoles || [],
      ignoreBotExecutors: body.ignoreBotExecutors || false,
      ignoreBotTargets: body.ignoreBotTargets || false,
      channelRoutes: body.channelRoutes || {},
      embedColors: body.embedColors || {},
      otherOptions: body.otherOptions || {},
    }
  });

  await redis.del(`config:${guildId}`);

  return NextResponse.json({ success: true, config });
}
