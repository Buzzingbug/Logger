import { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
      authorization: { params: { scope: 'identify guilds' } },
    }),
  ],
  callbacks: {
    async signIn({ profile }: any) {
      const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',') || [];
      if (adminIds.length === 0) {
        console.warn('ADMIN_DISCORD_IDS is not set! Denying all logins for security.');
        return false;
      }
      
      if (profile && adminIds.includes(profile.id)) {
        return true; // Allow login
      }
      
      console.log(`Unauthorized login attempt blocked for Discord ID: ${profile?.id}`);
      return false; // Deny login
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: any) {
      // @ts-ignore
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
};
