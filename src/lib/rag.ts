import { prisma } from "@/lib/prisma";

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const EMBEDDING_DIM = 512;

/**
 * Get an embedding vector for a piece of text using Voyage AI.
 * Falls back to a zero vector if API key is not configured.
 */
export async function embed(text: string): Promise<number[]> {
  if (!VOYAGE_API_KEY) {
    console.error("[RAG] VOYAGE_API_KEY not set — returning zero vector");
    return new Array(EMBEDDING_DIM).fill(0);
  }

  const attempt = async (): Promise<Response> => {
    const r = await fetch(VOYAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "voyage-3-lite",
        input: [text],
        input_type: "document",
      }),
    });
    // Free tier is 3 RPM — back off and retry once on rate limit
    if (r.status === 429) {
      await new Promise((res) => setTimeout(res, 22000));
      return attempt();
    }
    return r;
  };

  const res = await attempt();

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Voyage API error: ${res.status} ${err}`);
  }

  const data = await res.json() as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}

/**
 * Retrieve the top-k most relevant knowledge chunks for a query.
 * Uses cosine similarity via pgvector.
 */
export async function retrieveContext(query: string, topK = 4): Promise<string> {
  if (!VOYAGE_API_KEY) {
    return ""; // no vector search without embeddings
  }

  const queryEmbedding = await embed(query);
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  // Raw query for cosine similarity — Prisma doesn't support vector ops natively
  const results = await prisma.$queryRawUnsafe<Array<{ title: string; content: string; source: string }>>(
    `SELECT title, content, source
     FROM "KnowledgeChunk"
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    vectorStr,
    topK
  );

  if (results.length === 0) return "";

  return results
    .map((r) => `## ${r.title}\n${r.content}`)
    .join("\n\n---\n\n");
}

/**
 * Ingest a document into the knowledge base.
 * Chunks it, embeds each chunk, and stores in KnowledgeChunk.
 */
export async function ingestDocument(doc: {
  title: string;
  source: string;
  content: string;
}): Promise<void> {
  const chunks = chunkText(doc.content, 1200, 200);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkTitle = i === 0 ? doc.title : `${doc.title} (part ${i + 1})`;

    const embedding = await embed(chunk);
    const vectorStr = `[${embedding.join(",")}]`;

    // Check if chunk already exists
    const existing = await prisma.knowledgeChunk.findFirst({
      where: { source: doc.source, title: chunkTitle },
    });

    if (existing) {
      await prisma.$executeRawUnsafe(
        `UPDATE "KnowledgeChunk" SET content = $1, embedding = $2::vector WHERE id = $3`,
        chunk,
        vectorStr,
        existing.id
      );
    } else {
      const newChunk = await prisma.knowledgeChunk.create({
        data: { title: chunkTitle, source: doc.source, content: chunk },
      });
      await prisma.$executeRawUnsafe(
        `UPDATE "KnowledgeChunk" SET embedding = $1::vector WHERE id = $2`,
        vectorStr,
        newChunk.id
      );
    }
  }
}

/**
 * Split text into overlapping chunks of roughly `size` chars.
 */
function chunkText(text: string, size: number, overlap: number): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length > size && current.length > 0) {
      chunks.push(current.trim());
      // Keep overlap
      const words = current.split(" ");
      current = words.slice(-Math.floor(overlap / 6)).join(" ") + "\n\n" + para;
    } else {
      current = current ? current + "\n\n" + para : para;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text];
}
