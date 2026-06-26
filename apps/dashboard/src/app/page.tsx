import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { LandingUI } from "./components/LandingUI";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return <LandingUI isLoggedIn={!!session} />;
}
