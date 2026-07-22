import AuthCard from "@/components/auth/AuthCard";

export default function RegisterPage() {
  return (
    // Ambient emerald glow behind the sign-up card — on by default, brightens on
    // hover, matching the landing hero. `isolate` gives the -z-10 glow a stacking
    // context so it sits behind the card but in front of the page background.
    <div className="group relative isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[420px] w-[520px] max-w-[130%] -translate-x-1/2 -translate-y-1/2 opacity-60 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(52,211,153,0.18), transparent 70%)" }}
      />
      <AuthCard
        title="Create your account"
        subtitle="Set up your profile and start tracking your prep."
        variant="register"
      />
    </div>
  );
}
