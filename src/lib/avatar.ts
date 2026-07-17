export type AvatarKey = "avatar:1" | "avatar:2" | "avatar:3" | "avatar:4";

export const AVATARS: { key: AvatarKey; emoji: string; bg: string; label: string }[] = [
  { key: "avatar:1", emoji: "🤖", bg: "bg-rose-500/25", label: "Robot" },
  { key: "avatar:2", emoji: "👾", bg: "bg-emerald-500/25",  label: "Alien" },
  { key: "avatar:3", emoji: "🐱", bg: "bg-amber-500/25",  label: "Cat" },
  { key: "avatar:4", emoji: "🦊", bg: "bg-orange-500/25",    label: "Fox" },
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
