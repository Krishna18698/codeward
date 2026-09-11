import AuthCard from "@/components/auth/AuthCard";
import HeroGlow from "@/components/landing/HeroGlow";
import { safeCallback } from "@/lib/callbackUrl";

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  // Carried over from the login page's "Sign up free" link, so a logged-out
  // deep link still resolves for someone who signs up rather than signs in.
  const { callbackUrl } = await searchParams;

  return (
    // Ambient emerald glow behind the sign-up card — static, sized for the card
    // and centered on it.
    <HeroGlow radius={280} restY="50%" baseOpacity={0.5}>
      <AuthCard
        title="Create your account"
        subtitle="Set up your profile and start tracking your prep."
        variant="register"
        callbackUrl={safeCallback(callbackUrl)}
      />
    </HeroGlow>
  );
}
