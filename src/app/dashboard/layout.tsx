import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/dashboard/DashboardShell";

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

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
