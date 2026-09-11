import AuthCard from "@/components/auth/AuthCard";
import { safeCallback } from "@/lib/callbackUrl";

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  // proxy.ts puts the requested dashboard path here when it bounces a logged-out
  // user; without reading it back, every deep link landed on /dashboard instead.
  const { callbackUrl } = await searchParams;

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to continue your prep."
      variant="login"
      callbackUrl={safeCallback(callbackUrl)}
    />
  );
}
