import type { Metadata } from "next";
import MarketingPage, { MarketingSection } from "@/components/landing/MarketingPage";

export const metadata: Metadata = {
  title: "Terms of Service — Codeward",
  description: "The terms for using Codeward.",
};

export default function TermsPage() {
  return (
    <MarketingPage
      eyebrow="Terms · Last updated July 2026"
      title="Terms of Service"
      intro="The short version: Codeward is a free service provided as-is, to help you practice. Use it fairly, don't abuse the infrastructure, and understand there are no guarantees."
    >
      <MarketingSection title="Using Codeward">
        <p>
          By creating an account or using the site, you agree to these terms. If you don&rsquo;t agree, please
          don&rsquo;t use the service. You need to be old enough to form a binding agreement in your jurisdiction to
          create an account.
        </p>
      </MarketingSection>

      <MarketingSection title="Your account">
        <p>
          You&rsquo;re responsible for what happens under your account and for keeping your login secure. Provide
          accurate information at sign-up, and don&rsquo;t impersonate someone else.
        </p>
      </MarketingSection>

      <MarketingSection title="Acceptable use">
        <p>Please don&rsquo;t:</p>
        <ul className="list-disc ml-5 space-y-1.5 text-neutral-300">
          <li>Attempt to attack, overload, scrape, or reverse-engineer the service or its infrastructure</li>
          <li>Abuse the code-execution feature to run malicious code, mine, exfiltrate data, or exhaust resources</li>
          <li>Try to extract answer keys, rubrics, or other graded ground-truth content</li>
          <li>Use automated means to hammer the AI grading, chat, or execution endpoints beyond normal use</li>
        </ul>
      </MarketingSection>

      <MarketingSection title="Code execution">
        <p>
          Build It runs the code you submit in a third-party, network-isolated sandbox purely to test your solution.
          Submit only code intended for that purpose. Execution is subject to a shared daily budget and per-user rate
          limits, so &ldquo;Run Tests&rdquo; may be temporarily unavailable — the rest of the app keeps working.
        </p>
      </MarketingSection>

      <MarketingSection title="Content">
        <p>
          The exercises, articles, rubrics, and other materials are provided for your personal interview preparation.
          The work you write — your comments, diagnoses, code, and notes — stays yours; you grant us permission to
          store and process it to provide the service (including sending it to the AI and execution providers that
          grade or run it).
        </p>
      </MarketingSection>

      <MarketingSection title="No warranty">
        <p>
          Codeward is provided &ldquo;as is,&rdquo; without warranties of any kind. AI-generated grading and feedback
          can be wrong — treat it as practice, not an authoritative judgment of your skill or a guarantee of interview
          outcomes. To the extent permitted by law, we&rsquo;re not liable for any damages arising from your use of
          the service.
        </p>
      </MarketingSection>

      <MarketingSection title="Availability & changes">
        <p>
          This is a free project maintained by one person. Features may change, break, or go away, and the service may
          be unavailable at times. We may update these terms; continued use after a change means you accept the
          updated terms.
        </p>
      </MarketingSection>

      <MarketingSection title="Termination">
        <p>
          You can stop using Codeward and request account deletion at any time. We may suspend or remove accounts that
          violate these terms.
        </p>
      </MarketingSection>

      <MarketingSection title="Contact">
        <p>
          Questions about these terms? Reach us via the{" "}
          <a href="/contact" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">contact page</a>.
        </p>
      </MarketingSection>
    </MarketingPage>
  );
}
