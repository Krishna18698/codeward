"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
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
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(user.name ?? "");
  const [exp, setExp]         = useState(user.experienceLevel ?? "");
  const [company, setCompany] = useState(user.targetCompany ?? "");
  const [avatar, setAvatar]   = useState<AvatarKey | null>(
    isLocalAvatar(user.image) ? user.image : null,
  );
  const [saving, setSaving]   = useState(false);

  const showAvatarPicker = !user.image || isLocalAvatar(user.image);
  const expLabel = EXP_LEVELS.find((l) => l.value === exp)?.label;

  const cancel = () => {
    setName(user.name ?? "");
    setExp(user.experienceLevel ?? "");
    setCompany(user.targetCompany ?? "");
    setAvatar(isLocalAvatar(user.image) ? user.image : null);
    setEditing(false);
  };

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
      setEditing(false);
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // ── Read-only summary, with an Edit button that swaps in the form ──
  if (!editing) {
    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-neutral-400 mb-1">Display name</p>
            <p className="text-sm text-neutral-200">{name || "—"}</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-800 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:border-neutral-600 hover:text-white"
          >
            <Pencil size={11} /> Edit
          </button>
        </div>
        <div>
          <p className="text-xs font-medium text-neutral-400 mb-1">Experience level</p>
          <p className="text-sm text-neutral-200">{expLabel ?? "Not set"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-neutral-400 mb-1">Target company</p>
          <p className="text-sm text-neutral-200">{company || "Not set"}</p>
        </div>
      </div>
    );
  }

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
          <label className="block text-xs font-medium text-neutral-400 mb-2">Profile avatar</label>
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
                    ? "border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/30"
                    : "border-neutral-800 hover:border-neutral-600 bg-neutral-900/40",
                )}
              >
                <div className={cn(
                  `w-12 h-12 rounded-full ${av.bg} flex items-center justify-center text-2xl`,
                )}>
                  {av.emoji}
                </div>
                <span className="text-[10px] text-neutral-500">{av.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5">Experience level</label>
        <div className="flex gap-2">
          {EXP_LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => setExp(l.value)}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2 text-xs transition-all duration-150",
                exp === l.value
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                  : "border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral-400 mb-1.5">Target company</label>
        <div className="grid grid-cols-4 gap-2">
          {COMPANIES.map((c) => (
            <button
              key={c}
              onClick={() => setCompany(c)}
              className={cn(
                "rounded-xl border px-2 py-2 text-xs transition-all duration-150",
                company === c
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                  : "border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} loading={saving} size="md">
          Save changes
        </Button>
        <button
          onClick={cancel}
          disabled={saving}
          className="px-3 py-2 text-xs text-neutral-500 transition-colors hover:text-neutral-300 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
