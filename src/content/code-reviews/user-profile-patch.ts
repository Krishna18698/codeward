import type { CodeReviewExercise } from "./types";

export const userProfilePatch: CodeReviewExercise = {
  slug: "user-profile-patch",
  title: "Add user profile update endpoint",
  brief:
    "Mobile needs to let users edit name / email / avatar without re-sending the whole profile object every time. " +
    "This adds PATCH /users/:id for partial updates. Review the PATCH semantics carefully — partial-update endpoints are where teams ship regressions.",
  language: "TypeScript",
  minutes: 10,
  files: [
    {
      name: "profile.ts",
      code: `router.patch("/users/:id", async (req, res) => {
  const updates = req.body;

  const user = await db.user.update({
    where: { id: req.params.id },
    data: updates,
  });

  res.json(user);
});`,
    },
  ],
  bugs: [
    {
      id: "idor",
      severity: 5,
      category: "security",
      description:
        "No check that the authenticated user owns :id. Any logged-in user can PATCH any other user's profile by changing the path id — an IDOR. Must verify req.user.id === req.params.id (or an admin role).",
    },
    {
      id: "mass-assignment",
      severity: 5,
      category: "security",
      description:
        "`data: updates` passes the entire request body straight into the update — mass assignment. A client can set fields they should never control (role, isAdmin, emailVerified, balance, passwordHash). Whitelist the editable fields (name, email, avatar) explicitly.",
    },
    {
      id: "email-uniqueness-verification",
      severity: 4,
      category: "correctness",
      description:
        "Email can be changed with no uniqueness handling (a DB unique-constraint violation returns an ugly 500 instead of a clean 409) and no re-verification — changing email should reset emailVerified and trigger a confirmation flow, not silently trust the new address.",
    },
    {
      id: "no-validation",
      severity: 3,
      category: "api-design",
      description:
        "No validation of the incoming values — an empty name, a malformed email, or an avatar field of the wrong type is written as-is. PATCH still needs per-field validation on whatever keys are present.",
    },
    {
      id: "missing-user-404",
      severity: 2,
      category: "correctness",
      description:
        "update() on a non-existent id throws (Prisma P2025) and returns a 500. A PATCH to an unknown user should be a clean 404.",
    },
  ],
};
