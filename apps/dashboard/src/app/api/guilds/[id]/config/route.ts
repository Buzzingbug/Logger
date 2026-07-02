import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { prisma, redis } from '@logger/db';
import { GuildConfig } from '@logger/shared';

async function isUserAdmin(guildId: string, accessToken?: string): Promise<boolean> {
  if (!accessToken) return false;
  
  const cacheKey = `user_guilds:${accessToken}`;
  let guildsData = await redis.get(cacheKey);
  let guilds: any[] = [];
  
  if (guildsData) {
    guilds = JSON.parse(guildsData);
  } else {
    try {
      const res = await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        guilds = await res.json();
        await redis.set(cacheKey, JSON.stringify(guilds), 'EX', 300); // 5 min cache
      }
    } catch (e) {
      console.error('Failed to fetch user guilds', e);
    }
  }

  const targetGuild = guilds.find((g: any) => g.id === guildId);
  if (!targetGuild) return false;

  const permissions = BigInt(targetGuild.permissions);
  return (permissions & BigInt(0x8)) === BigInt(0x8) || (permissions & BigInt(0x20)) === BigInt(0x20); // Admin or Manage Server
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: guildId } = await params;
  
  // @ts-ignore
  if (!(await isUserAdmin(guildId, session.accessToken))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let config = await prisma.guildConfig.findUnique({
    where: { guildId }
  });

  if (!config) {
    return NextResponse.json({
      guildId,
      language: 'en-US',
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

  return NextResponse.json({
    ...config,
    language: (config.otherOptions as any)?.language || 'en-US'
  });
}

export async function POST(req: any, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: guildId } = await params;
  
  // @ts-ignore
  if (!(await isUserAdmin(guildId, session.accessToken))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: Partial<GuildConfig> = await req.json();

  const mergedOtherOptions = {
    ...(body.otherOptions || {}),
    language: body.language || 'en-US'
  };

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
      otherOptions: mergedOtherOptions,
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
      otherOptions: mergedOtherOptions,
    }
  });

  await redis.del(`config:${guildId}`);

  return NextResponse.json({ success: true, config: { ...config, language: mergedOtherOptions.language } });
}
