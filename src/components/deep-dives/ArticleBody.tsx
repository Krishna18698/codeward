"use client";
import { lazy, Suspense } from "react";

// Same lazy strategy as MarkdownMessage — keeps the markdown pipeline out of
// the shared bundle; plain text shows for the frame the chunk takes to load.
const ArticleMarkdown = lazy(() => import("./ArticleMarkdown"));

export default function ArticleBody({ body }: { body: string }) {
  return (
    <Suspense fallback={<div className="whitespace-pre-wrap text-[15px] leading-7 text-neutral-300">{body}</div>}>
      <ArticleMarkdown body={body} />
    </Suspense>
  );
}
