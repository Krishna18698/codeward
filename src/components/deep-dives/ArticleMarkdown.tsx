"use client";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

/** Article-scale markdown renderer (larger prose than the chat's MarkdownMessage). */
export default function ArticleMarkdown({ body }: { body: string }) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeSanitize]}
      components={{
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold tracking-heading text-white mt-10 mb-3 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-white mt-7 mb-2">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-[15px] leading-7 text-neutral-300 mb-4">{children}</p>
        ),
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-neutral-200">{children}</em>,
        ul: ({ children }) => <ul className="list-disc ml-5 space-y-1.5 mb-4 text-[15px] leading-7 text-neutral-300">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-5 space-y-1.5 mb-4 text-[15px] leading-7 text-neutral-300">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        code: ({ children }) => (
          <code className="rounded border border-neutral-800 bg-white/5 px-1.5 py-0.5 font-mono text-[13px] text-emerald-300">{children}</code>
        ),
        pre: ({ children }) => (
          <pre className="rounded-xl border border-neutral-800 bg-surface p-4 mb-4 overflow-x-auto font-mono text-[13px] leading-6 text-neutral-300 [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-neutral-300">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-emerald-500/50 bg-emerald-500/4 rounded-r-lg pl-4 pr-3 py-2 my-5 [&_p]:mb-0 [&_p]:text-neutral-200">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-neutral-800 my-8" />,
      }}
    >
      {body}
    </ReactMarkdown>
  );
}
