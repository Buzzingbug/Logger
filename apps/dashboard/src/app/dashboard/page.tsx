import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "@logger/db";
import { redirect } from "next/navigation";

export default async function DashboardIndex() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  // Fetch the first guild config
  const firstGuild = await prisma.guildConfig.findFirst();
  
  if (firstGuild) {
    redirect(`/dashboard/${firstGuild.guildId}/channels`);
  }

  // If no guilds configured yet
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0f11] text-white p-6 text-center">
      <div className="max-w-md p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
        <h1 className="text-3xl font-bold mb-4">No Servers Found</h1>
        <p className="text-[#8b8b99]">
          The bot hasn't joined any servers yet, or hasn't created a configuration. Add the bot to your Discord server first!
        </p>
      </div>
    </div>
  );
}
