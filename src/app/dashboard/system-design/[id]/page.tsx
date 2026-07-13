import { getSessionUserId } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SDWorkspace from "@/components/system-design/SDWorkspace";

type Props = { params: Promise<{ id: string }> };

export default async function SDQuestionPage({ params }: Props) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { id } = await params;

  const [question, note] = await Promise.all([
    prisma.systemDesignQuestion.findUnique({ where: { id } }),
    prisma.userNote.findFirst({
      where: { userId, sdQuestionId: id },
      select: { content: true },
    }),
  ]);

  if (!question) notFound();

  return (
    <SDWorkspace
      question={question}
      initialNote={note?.content ?? ""}
      userId={userId}
    />
  );
}
