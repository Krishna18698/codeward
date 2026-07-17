"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, Sparkles, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  subtitle?: string;
  variant: "login" | "register";
};

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  // No length rule on login — the server decides if the password matches
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  // Must match the register API's minimum (8)
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

type LoginFields = z.infer<typeof loginSchema>;
type RegisterFields = z.infer<typeof registerSchema>;

export default function AuthCard({ title, subtitle, variant }: Props) {
  const isLogin = variant === "login";
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(isLogin ? loginSchema : registerSchema) as any,
  });

  const handleGoogle = () => {
    setGoogleLoading(true);
    // signIn navigates away; the state resets if the user comes back
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const onSubmit = async (data: LoginFields | RegisterFields) => {
    if (isLogin) {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (res?.error) {
        // Form-level error — we can't know whether email or password was wrong
        setError("root", { message: "Invalid email or password" });
        return;
      }
      router.push("/dashboard");
    } else {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const { error } = await res.json();
        const message: string = error ?? "Registration failed";
        // Route the server error to the field it's actually about
        if (/password/i.test(message)) setError("password", { message });
        else if (/email/i.test(message)) setError("email", { message });
        else setError("root", { message });
        return;
      }
      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      router.push("/dashboard");
    }
  };

  return (
    <div className="animate-scale-in">
      {/* Mobile-only brand */}
      <div className="flex items-center gap-2 mb-8 lg:hidden">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <Sparkles size={14} className="text-emerald-400" />
        </div>
        <span className="text-sm font-bold text-white">
          Code<span className="text-emerald-400">ward</span>
        </span>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h2 className="text-3xl font-semibold tracking-heading text-white">{title}</h2>
        {subtitle && <p className="text-sm text-neutral-500 mt-1.5">{subtitle}</p>}
      </div>

      {/* Google OAuth — primary CTA */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className={cn(
          "w-full inline-flex items-center justify-center gap-3",
          "rounded-2xl border border-neutral-700/80 bg-neutral-900 hover:bg-neutral-800",
          "text-neutral-100 text-sm font-medium px-5 py-3.5 transition-all duration-150",
          "hover:border-neutral-600",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        )}
      >
        <Image src="/icons/google.svg" alt="Google" width={18} height={18} />
        {googleLoading
          ? "Redirecting to Google…"
          : isLogin ? "Continue with Google" : "Sign up with Google"}
        {googleLoading
          ? <Loader2 size={14} className="ml-auto text-neutral-500 animate-spin" />
          : <ArrowRight size={14} className="ml-auto text-neutral-500" />}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-neutral-800/80" />
        <span className="text-[11px] uppercase tracking-widest text-neutral-500">or continue with email</span>
        <div className="h-px flex-1 bg-neutral-800/80" />
      </div>

      {/* Email/password form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!isLogin && (
          <Input
            {...register("name")}
            label="Display name"
            autoComplete="name"
            autoFocus
            placeholder="John Doe"
            icon={<User size={14} />}
            error={errors.name?.message}
          />
        )}

        <Input
          {...register("email")}
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus={isLogin}
          placeholder="you@example.com"
          icon={<Mail size={14} />}
          error={errors.email?.message}
        />

        <Input
          {...register("password")}
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete={isLogin ? "current-password" : "new-password"}
          placeholder={isLogin ? "Your password" : "At least 8 characters"}
          icon={<Lock size={14} />}
          error={errors.password?.message}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
        />

        {errors.root?.message && (
          <p className="text-xs text-red-400 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
            {errors.root.message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          loading={isSubmitting}
        >
          {isLogin ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-xs text-neutral-500 text-center">
        {isLogin ? (
          <>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Sign up free
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
