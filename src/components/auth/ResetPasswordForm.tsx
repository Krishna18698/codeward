"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Sparkles, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z
  .object({
    // Must match the API's rule (8–128)
    password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

type Fields = z.infer<typeof schema>;

export default function ResetPasswordForm({ token, email }: { token?: string; email?: string }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) });

  const linkOk = Boolean(token && email);

  const onSubmit = async (data: Fields) => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError("root", { message: json.error ?? "Something went wrong. Try again." });
        return;
      }
      setDone(true);
      // Give them a beat to read the confirmation, then send them to sign in.
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("root", { message: "Network error. Check your connection and try again." });
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
          <Sparkles size={14} className="text-accent" />
        </div>
        <span className="text-sm font-bold text-primary">
          Code<span className="text-accent">ward</span>
        </span>
      </div>

      {!linkOk ? (
        <>
          <h2 className="text-3xl font-semibold tracking-heading text-primary">Invalid reset link</h2>
          <p className="text-sm text-secondary mt-3 leading-relaxed">
            This link is missing information. Request a fresh one — reset links expire after an hour
            and can only be used once.
          </p>
          <Link
            href="/forgot-password"
            className="mt-8 inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors font-medium"
          >
            <ArrowLeft size={14} />
            Request a new link
          </Link>
        </>
      ) : done ? (
        <>
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10">
            <CheckCircle2 size={18} className="text-accent" />
          </div>
          <h2 className="text-3xl font-semibold tracking-heading text-primary">Password updated</h2>
          <p className="text-sm text-secondary mt-3 leading-relaxed">
            You can now sign in with your new password. Taking you to sign in…
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors font-medium"
          >
            Go to sign in
          </Link>
        </>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-3xl font-semibold tracking-heading text-primary">
              Choose a new password
            </h2>
            <p className="text-sm text-muted mt-1.5">
              Setting a new password for <span className="text-secondary">{email}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register("password")}
              label="New password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              autoFocus
              placeholder="At least 8 characters"
              icon={<Lock size={14} />}
              error={errors.password?.message}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="p-1.5 text-muted hover:text-secondary transition-colors"
                  tabIndex={-1}
                >
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />

            <Input
              {...register("confirm")}
              label="Confirm new password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              icon={<Lock size={14} />}
              error={errors.confirm?.message}
            />

            {errors.root?.message && (
              <p className="text-xs text-red-400 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                {errors.root.message}
              </p>
            )}

            <Button type="submit" className="w-full mt-2" size="lg" loading={isSubmitting}>
              Update password
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted text-center">
            <Link href="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
