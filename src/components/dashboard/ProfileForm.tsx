"use client";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AVATARS, isLocalAvatar, type AvatarKey } from "@/lib/avatar";

const COMPANIES = ["Meta", "Google", "Amazon", "Apple", "Microsoft", "Netflix", "Startup", "Other"];
const EXP_LEVELS = [
  { value: "JUNIOR", label: "Junior (0–2 yrs)" },
  { value: "MID",    label: "Mid-level (2–5 yrs)" },
  { value: "SENIOR", label: "Senior (5+ yrs)" },
];

type User = {
  name: string | null;
  email: string | null;
  image: string | null;
  experienceLevel: string | null;
  targetCompany: string | null;
};

export default function ProfileForm({ user }: { user: User }) {
  const [name, setName]       = useState(user.name ?? "");
  const [exp, setExp]         = useState(user.experienceLevel ?? "");
  const [company, setCompany] = useState(user.targetCompany ?? "");
  const [avatar, setAvatar]   = useState<AvatarKey | null>(
    isLocalAvatar(user.image) ? user.image : null,
  );
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const showAvatarPicker = !user.image || isLocalAvatar(user.image);

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, string | undefined> = {
        name,
        experienceLevel: exp,
        targetCompany: company,
      };
      if (showAvatarPicker && avatar) body.image = avatar;

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile updated");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Input
        label="Display name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
      />

      {showAvatarPicker && (
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Profile avatar</label>
          <div className="flex gap-3">
            {AVATARS.map((av) => (
              <button
                key={av.key}
                type="button"
                onClick={() => setAvatar(av.key)}
                title={av.label}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all duration-150",
                  avatar === av.key
                    ? "border-sky-500/60 bg-sky-500/10 ring-1 ring-sky-500/30"
                    : "border-slate-800 hover:border-slate-600 bg-slate-900/40",
                )}
              >
                <div className={cn(
                  `w-12 h-12 rounded-full bg-linear-to-br ${av.bg} flex items-center justify-center text-2xl`,
                )}>
                  {av.emoji}
                </div>
                <span className="text-[10px] text-slate-500">{av.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Experience level</label>
        <div className="flex gap-2">
          {EXP_LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setExp(l.value)}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2 text-xs transition-all duration-150",
                exp === l.value
                  ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
                  : "border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Target company</label>
        <div className="grid grid-cols-4 gap-2">
          {COMPANIES.map((c) => (
            <button
              key={c}
              onClick={() => setCompany(c)}
              className={cn(
                "rounded-xl border px-2 py-2 text-xs transition-all duration-150",
                company === c
                  ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
                  : "border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={save}
        loading={saving}
        size="md"
        className="bg-none bg-sky-500 hover:bg-sky-400 hover:brightness-100"
      >
        {saved ? "Saved ✓" : "Save changes"}
      </Button>
    </div>
  );
}
