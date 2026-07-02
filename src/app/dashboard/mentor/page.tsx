export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MentorPageClient from "@/components/dashboard/MentorPageClient";

export default async function MentorPage() {
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  const conversations = await prisma.mentorConversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, messageType: true },
      },
    },
  });

  const initialConversations = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    updatedAt: c.updatedAt.toISOString(),
    lastMessage: c.messages[0]?.content?.slice(0, 80) ?? "",
  }));

  return <MentorPageClient initialConversations={initialConversations} />;
}
