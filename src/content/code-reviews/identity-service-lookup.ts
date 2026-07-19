import type { CodeReviewExercise } from "./types";

export const identityServiceLookup: CodeReviewExercise = {
  slug: "identity-service-lookup",
  title: "Refactor user lookup to the identity service",
  brief:
    "The auth team's new identity-service client is finally stable — moving login lookup over to it so we can delete our own user-lifecycle bookkeeping. " +
    "Auth owns active / banned / soft-deleted now. Last review before we route real traffic through this.",
  language: "TypeScript",
  minutes: 12,
  files: [
    {
      name: "login.ts",
      code: `export async function login(email: string, password: string) {
  const user = await identityService.getUserByEmail(email);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new Error("invalid credentials");
  }

  const token = signJwt({ sub: user.id });
  return { token, user };
}`,
    },
  ],
  bugs: [
    {
      id: "no-lifecycle-check",
      severity: 5,
      category: "security",
      description:
        "The brief says the identity service now owns active/banned/soft-deleted status — but this code never checks it. A banned or soft-deleted user still logs in successfully. After the refactor, login must reject users whose identity-service status isn't 'active'.",
    },
    {
      id: "null-user-timing",
      severity: 4,
      category: "security",
      description:
        "If getUserByEmail returns null for an unknown email, `user.passwordHash` throws a 500 (info leak + crash). Worse, returning early on unknown email creates a timing/behavior difference that lets attackers enumerate which emails exist. Handle the null and keep the response uniform (still do a dummy bcrypt compare to equalize timing).",
    },
    {
      id: "no-error-handling-remote",
      severity: 4,
      category: "correctness",
      description:
        "identityService.getUserByEmail is now a network call with no timeout, retry, or failure handling. If the identity service is slow or down, login hangs or throws an unhandled error — the auth path is now coupled to a remote service's availability. Needs a timeout and a defined failure behavior (fail closed).",
    },
    {
      id: "error-message-specific",
      severity: 2,
      category: "security",
      description:
        "Throwing 'invalid credentials' only on password mismatch, while an unknown email throws a different error (the null crash), lets attackers distinguish 'no such user' from 'wrong password'. All auth failures should be indistinguishable from outside.",
    },
    {
      id: "no-rate-limit-note",
      severity: 2,
      category: "security",
      description:
        "Login has no brute-force protection visible here. Moving to a remote lookup doesn't remove the need for per-account / per-IP rate limiting on failed attempts — worth confirming it exists upstream before routing real traffic.",
    },
  ],
};
