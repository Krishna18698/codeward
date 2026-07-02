import Image from "next/image";

export default function AuthHero() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Image
        src="/images/brain-hero.png"
        alt="AI Brain"
        fill
        priority
        className="object-cover opacity-80"
      />
      
      
    </div>
  );
}