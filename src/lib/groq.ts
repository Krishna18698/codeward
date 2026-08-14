// Central Groq model id — swap here to migrate every AI route at once (mentor
// chat/eval/sheet-gen + Code Review / Bug Hunt / Build It graders). Must be a
// Groq model available on this account that supports tool-calling: the graders
// use forced tool use (tool_choice: "required").
//
// Migrated off llama-3.3-70b-versatile (deprecated by Groq). gpt-oss-120b was
// verified against this account: forced tool-calling works, and its reasoning
// is returned in a separate `reasoning` field so the streamed chat `content`
// stays clean. (Llama 4 models are NOT available on this account.)
export const GROQ_MODEL = "openai/gpt-oss-120b";
