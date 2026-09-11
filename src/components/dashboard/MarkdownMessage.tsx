"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

/**
 * Markdown renderer for assistant replies. Split out of MentorChat so the
 * react-markdown + rehype pipeline is lazy-loaded on first use instead of
 * shipping in the shared dashboard bundle (MentorChat mounts on every page
 * via FloatingMentor).
 *
 * remarkGfm is load-bearing: tables are a GFM extension, and without it the
 * model's pipe-separated comparison tables came through as literal text in a
 * paragraph. ArticleMarkdown already had it; this renderer didn't.
 */
export default function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="text-primary font-semibold">{children}</strong>,
        em: ({ children }) => <em className="text-secondary italic">{children}</em>,
        h1: ({ children }) => <p className="text-primary font-bold text-sm mt-3 mb-1">{children}</p>,
        h2: ({ children }) => <p className="text-primary font-bold text-sm mt-3 mb-1">{children}</p>,
        h3: ({ children }) => <p className="text-primary font-semibold text-[13px] mt-2.5 mb-1">{children}</p>,
        ul: ({ children }) => <ul className="list-disc ml-4 space-y-0.5 my-1.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-4 space-y-0.5 my-1.5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        code: ({ children }) => <code className="bg-border border border-border rounded px-1.5 py-0.5 text-[11px] text-accent-hover font-mono">{children}</code>,
        pre: ({ children }) => <pre className="bg-surface border border-border rounded-xl p-3 my-2 overflow-x-auto text-[11px] font-mono text-secondary">{children}</pre>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-accent/40 pl-3 my-2 text-secondary italic">{children}</blockquote>,
        // A comparison table is usually wider than the chat bubble, so it
        // scrolls inside its own container rather than stretching the panel.
        table: ({ children }) => (
          <div className="my-2 overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-[11.5px]">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-surface">{children}</thead>,
        tr: ({ children }) => <tr className="border-b border-border last:border-0">{children}</tr>,
        th: ({ children }) => (
          <th className="px-2.5 py-1.5 text-left font-semibold text-primary whitespace-nowrap">{children}</th>
        ),
        td: ({ children }) => (
          <td className="px-2.5 py-1.5 align-top text-secondary">{children}</td>
        ),
        del: ({ children }) => <del className="text-muted line-through">{children}</del>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 hover:text-accent-hover">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
