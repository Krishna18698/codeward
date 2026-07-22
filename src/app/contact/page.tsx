import type { Metadata } from "next";
import MarketingPage, { MarketingSection } from "@/components/landing/MarketingPage";

export const metadata: Metadata = {
  title: "Contact — Codeward",
  description: "Reach out about feedback, bugs, or feature requests.",
};

// TODO: replace with your real contact address before going public.
const CONTACT_EMAIL = "hello@codeward.app";

export default function ContactPage() {
  return (
    <MarketingPage
      eyebrow="Contact"
      title="Get in touch."
      intro="Feedback, a bug, a broken exercise, or an idea for a new mode — it all helps. Codeward is run by one person, so the fastest way to reach a human is email."
    >
      <MarketingSection title="Email">
        <p>
          Write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
            {CONTACT_EMAIL}
          </a>
          . I read everything, though replies can take a few days.
        </p>
      </MarketingSection>

      <MarketingSection title="Good things to send">
        <ul className="list-disc ml-5 space-y-1.5 text-neutral-300">
          <li>A bug or something that looks wrong in an exercise, review, or grade</li>
          <li>An exercise you&rsquo;d love to see — a specific bug class, design problem, or topic</li>
          <li>Feedback on the AI grading: where it was too harsh, too lenient, or plainly wrong</li>
          <li>Anything confusing about how a mode works</li>
        </ul>
      </MarketingSection>

      <MarketingSection title="A note on scope">
        <p>
          This is a free, solo-built project — there&rsquo;s no support team and no SLA. That said, clear bug reports
          with steps to reproduce genuinely move things forward, and they&rsquo;re always welcome.
        </p>
      </MarketingSection>
    </MarketingPage>
  );
}
