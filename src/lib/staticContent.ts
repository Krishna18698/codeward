import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/** The System Design question bank is effectively static (changes only when the
 *  seed runs). Cache the full list across requests so it doesn't hit Neon on
 *  every navigation / filter click; callers filter in memory. Flush with
 *  revalidateTag("system-design-questions") after a re-seed. */
export const getSystemDesignQuestions = unstable_cache(
  async () =>
    prisma.systemDesignQuestion.findMany({
      orderBy: [{ mustDo: "desc" }, { order: "asc" }],
    }),
  ["system-design-questions"],
  { revalidate: 3600, tags: ["system-design-questions"] },
);
