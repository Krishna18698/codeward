import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SDWorkspace from "@/components/system-design/SDWorkspace";

type Props = { params: Promise<{ id: string }> };

export default async function SDQuestionPage({ params }: Props) {
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  const { id } = await params;

  const [question, note] = await Promise.all([
    prisma.systemDesignQuestion.findUnique({ where: { id } }),
    prisma.userNote.findFirst({
      where: { userId: user.id, sdQuestionId: id },
      select: { content: true },
    }),
  ]);

  if (!question) notFound();

  return (
    <SDWorkspace
      question={question}
      initialNote={note?.content ?? ""}
      userId={user.id}
    />
  );
}
