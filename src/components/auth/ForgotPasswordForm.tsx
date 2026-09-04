"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Sparkles, ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const schema = z.object({ email: z.string().email({ message: "Invalid email" }) });
type Fields = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Fields) => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError("root", { message: json.error ?? "Something went wrong. Try again." });
        return;
      }
      setSent(true);
    } catch {
      setError("root", { message: "Network error. Check your connection and try again." });
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Brand */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
          <Sparkles size={14} className="text-accent" />
        </div>
        <span className="text-sm font-bold text-primary">
          Code<span className="text-accent">ward</span>
        </span>
      </div>

      {sent ? (
        <>
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10">
            <MailCheck size={18} className="text-accent" />
          </div>
          <h2 className="text-3xl font-semibold tracking-heading text-primary">Check your email</h2>
          <p className="text-sm text-secondary mt-3 leading-relaxed">
            If an account exists for{" "}
            <span className="text-primary font-medium">{getValues("email")}</span>, we&apos;ve sent a
            link to reset your password. It expires in 1 hour.
          </p>
          <p className="text-xs text-muted mt-3 leading-relaxed">
            Nothing arrived? Check your spam folder, or make sure you signed up with email and
            password rather than Google.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors font-medium"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-3xl font-semibold tracking-heading text-primary">
              Forgot your password?
            </h2>
            <p className="text-sm text-muted mt-1.5">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register("email")}
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              icon={<Mail size={14} />}
              error={errors.email?.message}
            />

            {errors.root?.message && (
              <p className="text-xs text-red-400 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                {errors.root.message}
              </p>
            )}

            <Button type="submit" className="w-full mt-2" size="lg" loading={isSubmitting}>
              Send reset link
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted text-center">
            Remembered it?{" "}
            <Link href="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
