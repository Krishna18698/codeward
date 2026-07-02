"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, Sparkles, ArrowRight } from "lucide-react";
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
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(1, "Name is required"),
});

type LoginFields = z.infer<typeof loginSchema>;
type RegisterFields = z.infer<typeof registerSchema>;

export default function AuthCard({ title, subtitle, variant }: Props) {
  const isLogin = variant === "login";
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(isLogin ? loginSchema : registerSchema) as any,
  });

  const onSubmit = async (data: LoginFields | RegisterFields) => {
    if (isLogin) {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (res?.error) {
        setError("password", { message: "Invalid email or password" });
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
        setError("email", { message: error ?? "Registration failed" });
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
        <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
          <Sparkles size={14} className="text-sky-400" />
        </div>
        <span className="text-sm font-bold text-white">
          Code<span className="text-sky-400">ward</span>
        </span>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1.5">{subtitle}</p>}
      </div>

      {/* Google OAuth — primary CTA */}
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className={cn(
          "w-full inline-flex items-center justify-center gap-3",
          "rounded-2xl border border-slate-700/80 bg-slate-900 hover:bg-slate-800",
          "text-slate-100 text-sm font-medium px-5 py-3.5 transition-all duration-150",
          "hover:border-slate-600 hover:shadow-[0_0_20px_rgba(14,165,233,0.08)]",
        )}
      >
        <Image src="/icons/google.svg" alt="Google" width={18} height={18} />
        {isLogin ? "Continue with Google" : "Sign up with Google"}
        <ArrowRight size={14} className="ml-auto text-slate-500" />
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-slate-800/80" />
        <span className="text-[11px] uppercase tracking-widest text-slate-700">or continue with email</span>
        <div className="h-px flex-1 bg-slate-800/80" />
      </div>

      {/* Email/password form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!isLogin && (
          <Input
            {...register("name")}
            label="Display name"
            autoComplete="name"
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
          placeholder="you@example.com"
          icon={<Mail size={14} />}
          error={errors.email?.message}
        />

        <Input
          {...register("password")}
          label="Password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          placeholder={isLogin ? "Your password" : "At least 6 characters"}
          icon={<Lock size={14} />}
          error={errors.password?.message}
        />

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          loading={isSubmitting}
        >
          {isLogin ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-xs text-slate-600 text-center">
        {isLogin ? (
          <>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-sky-400 hover:text-sky-300 transition-colors font-medium">
              Sign up free
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-sky-400 hover:text-sky-300 transition-colors font-medium">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
