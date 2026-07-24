import AuthCard from "@/components/auth/AuthCard";
import HeroGlow from "@/components/landing/HeroGlow";

export default function RegisterPage() {
  return (
    // Ambient emerald glow behind the sign-up card — static, sized for the card
    // and centered on it.
    <HeroGlow radius={280} restY="50%" baseOpacity={0.5}>
      <AuthCard
        title="Create your account"
        subtitle="Set up your profile and start tracking your prep."
        variant="register"
      />
    </HeroGlow>
  );
}
