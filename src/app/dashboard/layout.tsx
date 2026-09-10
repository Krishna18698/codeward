import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { CompanyLogoSprite } from "@/components/ui/CompanyLogo";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Read the user server-side (from the JWT — no DB hit) so the nav's avatar and
  // name render in the SSR HTML and don't flicker in after the client session
  // resolves. This also gates the whole dashboard subtree.
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = {
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    email: session.user.email ?? null,
  };

  // Read the onboarding flag here rather than letting the shell fetch the whole
  // profile from the client on mount. That fetch cost a round trip per full page
  // load (74-460ms measured) to read one boolean the server can supply while it
  // is already rendering. Layouts persist across client-side navigation, so this
  // runs once per hard load, not per route change.
  const onboarded = session.user.id
    ? ((await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { onboarded: true },
      }))?.onboarded ?? true)
    : true;

  return (
    <>
      <CompanyLogoSprite />
      <DashboardShell user={user} onboarded={onboarded}>{children}</DashboardShell>
    </>
  );
}
