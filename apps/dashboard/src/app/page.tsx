import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import Link from "next/link";
import { LoginButton } from "./components/LoginButton";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#09090b]">
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#3b82f6]/10 blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#3b82f6]/5 blur-[120px] mix-blend-screen" />
      </div>

      <div className="z-10 flex flex-col items-center text-center px-6">
        <div className="mb-6 p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#e4e4e7] to-[#a1a1aa] tracking-tight mb-8">
          Logger.
        </h1>
        <p className="max-w-2xl text-xl text-[#a1a1aa] mb-12 leading-relaxed">
          The ultimate logging architecture. Secure, encrypted, and visually stunning. Admin access strictly enforced.
        </p>

        {session ? (
          <Link href="/dashboard" className="relative px-8 py-4 bg-[#18181b] hover:bg-[#27272a] text-[#e4e4e7] font-bold rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 border border-[#27272a] backdrop-blur-md">
            Enter Dashboard &rarr;
          </Link>
        ) : (
          <LoginButton />
        )}
      </div>
    </div>
  );
}
