import { NextResponse } from "next/server";
import { ingestDocument } from "@/lib/rag";
import { DSA_PATTERNS } from "@/lib/knowledge/dsa-patterns";
import { SYSTEM_DESIGN_CONCEPTS } from "@/lib/knowledge/system-design";

export async function POST(req: Request) {
  const INGEST_SECRET = process.env.INGEST_SECRET;
  if (!INGEST_SECRET) {
    return NextResponse.json({ error: "Ingest not configured" }, { status: 503 });
  }

  const { secret } = await req.json().catch(() => ({})) as { secret?: string };

  if (secret !== INGEST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const docs = [...DSA_PATTERNS, ...SYSTEM_DESIGN_CONCEPTS];
  const results: { title: string; status: string }[] = [];

  for (const doc of docs) {
    try {
      await ingestDocument(doc);
      results.push({ title: doc.title, status: "ok" });
      console.log(`[ingest] ✓ ${doc.title}`);
    } catch (e) {
      results.push({ title: doc.title, status: `error: ${String(e)}` });
      console.error(`[ingest] ✗ ${doc.title}`, e);
    }
  }

  return NextResponse.json({ ingested: results.length, results });
}
