"use client";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

/**
 * Markdown renderer for assistant replies. Split out of MentorChat so the
 * react-markdown + rehype pipeline is lazy-loaded on first use instead of
 * shipping in the shared dashboard bundle (MentorChat mounts on every page
 * via FloatingMentor).
 */
export default function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeSanitize]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
        em: ({ children }) => <em className="text-neutral-400 italic">{children}</em>,
        h1: ({ children }) => <p className="text-white font-bold text-sm mt-3 mb-1">{children}</p>,
        h2: ({ children }) => <p className="text-white font-bold text-sm mt-3 mb-1">{children}</p>,
        h3: ({ children }) => <p className="text-neutral-200 font-semibold text-[13px] mt-2.5 mb-1">{children}</p>,
        ul: ({ children }) => <ul className="list-disc ml-4 space-y-0.5 my-1.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-4 space-y-0.5 my-1.5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        code: ({ children }) => <code className="bg-neutral-800 border border-neutral-700/60 rounded px-1.5 py-0.5 text-[11px] text-emerald-300 font-mono">{children}</code>,
        pre: ({ children }) => <pre className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 my-2 overflow-x-auto text-[11px] font-mono text-neutral-300">{children}</pre>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-emerald-500/40 pl-3 my-2 text-neutral-400 italic">{children}</blockquote>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
