export type AvatarKey = "avatar:1" | "avatar:2" | "avatar:3" | "avatar:4";

export const AVATARS: { key: AvatarKey; emoji: string; bg: string; label: string }[] = [
  { key: "avatar:1", emoji: "🤖", bg: "from-rose-500/40 to-rose-500/40", label: "Robot" },
  { key: "avatar:2", emoji: "👾", bg: "from-emerald-500/40 to-teal-500/40",  label: "Alien" },
  { key: "avatar:3", emoji: "🐱", bg: "from-amber-500/40 to-orange-500/40",  label: "Cat" },
  { key: "avatar:4", emoji: "🦊", bg: "from-orange-500/40 to-red-500/40",    label: "Fox" },
];

export const RANDOM_AVATAR_KEYS: AvatarKey[] = ["avatar:1", "avatar:2", "avatar:3", "avatar:4"];

export function isLocalAvatar(image: string | null | undefined): image is AvatarKey {
  return typeof image === "string" && image.startsWith("avatar:");
}

export function getAvatarMeta(key: string) {
  return AVATARS.find((a) => a.key === key) ?? AVATARS[0];
}

export function randomAvatarKey(): AvatarKey {
  return RANDOM_AVATAR_KEYS[Math.floor(Math.random() * RANDOM_AVATAR_KEYS.length)];
}
