import type { CodeReviewExercise } from "./types";

export const jwtAuthMiddleware: CodeReviewExercise = {
  slug: "jwt-auth-middleware",
  title: "Add JWT auth middleware",
  brief:
    "We're cutting over from session cookies to JWT so mobile clients can authenticate without the cookie-jar dance. " +
    "This middleware validates the bearer token, extracts the user, and attaches them to the request context. " +
    "Review carefully — auth bugs ship to every endpoint at once.",
  language: "TypeScript",
  minutes: 12,
  files: [
    {
      name: "auth.ts",
      code: `import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "./db";

const SECRET = process.env.JWT_SECRET ?? "dev-secret";

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = header.replace("Bearer ", "");

  try {
    const payload = jwt.decode(token) as { sub: string; exp: number };

    const user = await db.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ error: \`No user for id \${payload.sub}\` });
    }

    (req as Request & { user: typeof user }).user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: (err as Error).stack });
  }
}`,
    },
  ],
  bugs: [
    {
      id: "decode-not-verify",
      severity: 5,
      category: "security",
      description:
        "jwt.decode() does NOT verify the signature — it just base64-decodes the payload. Anyone can forge a token with any sub and be authenticated as any user. Must use jwt.verify(token, SECRET, { algorithms: [...] }).",
    },
    {
      id: "no-expiry-check",
      severity: 4,
      category: "security",
      description:
        "exp is read from the payload but never checked (and decode() doesn't check it either) — expired tokens are accepted forever. verify() enforces exp; without it, stolen tokens never die.",
    },
    {
      id: "hardcoded-secret-fallback",
      severity: 4,
      category: "security",
      description:
        "SECRET falls back to the literal \"dev-secret\" when the env var is unset — a prod misconfiguration silently makes every token forgeable with a public string. Fail closed if JWT_SECRET is missing.",
    },
    {
      id: "stack-trace-leak",
      severity: 3,
      category: "security",
      description:
        "The catch branch returns err.stack to the client — internal paths and library internals leak in the 401 body. Log server-side; return a generic message.",
    },
    {
      id: "user-id-echo",
      severity: 2,
      category: "api-design",
      description:
        "The 'No user for id ...' message echoes the token's sub back — an enumeration/diagnostic aid for attackers, and inconsistent with the other generic 401s. All auth failures should look identical from outside.",
    },
  ],
};
