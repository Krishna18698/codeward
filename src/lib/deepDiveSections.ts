// Splits a deep-dive markdown body into numbered sections by its `## ` headings,
// so the reader can render a collapsible, progress-tracked section list without
// the article content having to be re-authored into a structured shape.
// Fenced code blocks are respected (a `##` inside ``` is not a heading).

export type DeepDiveSection = { title: string; content: string };

export function splitSections(body: string): DeepDiveSection[] {
  const lines = body.split("\n");
  const sections: DeepDiveSection[] = [];
  const lead: string[] = [];
  let current: DeepDiveSection | null = null;
  let inFence = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const heading = !inFence ? line.match(/^##\s+(.+?)\s*$/) : null;
    if (heading) {
      if (current) sections.push(current);
      current = { title: heading[1], content: "" };
    } else if (current) {
      current.content += line + "\n";
    } else {
      lead.push(line);
    }
  }
  if (current) sections.push(current);

  // Any prose before the first `##` becomes an intro section so nothing is lost.
  const leadText = lead.join("\n").trim();
  if (leadText) sections.unshift({ title: "Overview", content: leadText });

  for (const s of sections) s.content = s.content.trim();
  return sections;
}
