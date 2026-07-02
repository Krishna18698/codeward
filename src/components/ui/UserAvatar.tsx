import Image from "next/image";
import { isLocalAvatar, getAvatarMeta } from "@/lib/avatar";
import { cn } from "@/lib/cn";

type Props = {
  image: string | null | undefined;
  name: string | null | undefined;
  size?: number;
  className?: string;
  textSize?: string;
};

export default function UserAvatar({ image, name, size = 32, className, textSize }: Props) {
  const initials = (name ?? "?")
    .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const rounded = "rounded-full";
  const dims = { width: size, height: size };
  const style = { width: size, height: size, minWidth: size };

  if (image && isLocalAvatar(image)) {
    const av = getAvatarMeta(image);
    return (
      <div
        style={style}
        className={cn(
          `bg-linear-to-br ${av.bg} ${rounded} flex items-center justify-center shrink-0`,
          className,
        )}
      >
        <span style={{ fontSize: size * 0.45 }}>{av.emoji}</span>
      </div>
    );
  }

  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? "avatar"}
        {...dims}
        referrerPolicy="no-referrer"
        className={cn(`${rounded} object-cover shrink-0`, className)}
      />
    );
  }

  return (
    <div
      style={style}
      className={cn(
        `bg-linear-to-br from-sky-500/40 to-indigo-500/40 ${rounded} flex items-center justify-center shrink-0`,
        className,
      )}
    >
      <span className={cn("font-bold text-white", textSize ?? "text-[10px]")} style={{ fontSize: size * 0.35 }}>
        {initials}
      </span>
    </div>
  );
}
