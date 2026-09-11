import { redirect } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import { getSessionUserId } from "@/lib/auth";
import { safeCallback } from "@/lib/callbackUrl";

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  // proxy.ts puts the requested dashboard path here when it bounces a logged-out
  // user; without reading it back, every deep link landed on /dashboard instead.
  const { callbackUrl } = await searchParams;
  const destination = safeCallback(callbackUrl);

  // Already signed in? Go straight through.
  //
  // Landing here does NOT mean the session is gone. NextAuth sends its own
  // failures to this page (pages.signIn) with the session cookie untouched — a
  // stale OAuth `state`, a cancelled Google prompt, a replayed callback. Without
  // this check the form just appears, which reads as "you've been logged out",
  // and signing in again is the only apparent way out.
  const userId = await getSessionUserId();
  if (userId) redirect(destination);

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to continue your prep."
      variant="login"
      callbackUrl={destination}
    />
  );
}
