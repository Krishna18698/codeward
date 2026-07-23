import type { Metadata } from "next";
import MarketingPage, { MarketingSection } from "@/components/landing/MarketingPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Codeward",
  description: "What Codeward collects, why, and who it's shared with.",
};

export default function PrivacyPage() {
  return (
    <MarketingPage
      eyebrow="Legal"
      lastUpdated=" 20 July 2026"
      title="Privacy Policy"
      intro="Plain-language version: Codeward stores what it needs to run your account and grade your work, shares data only with the services that make those features work, and never sells it."
    >
      <MarketingSection title="What we collect">
        <ul className="list-disc ml-5 space-y-1.5 text-neutral-300">
          <li><strong className="text-white">Account details</strong> — your name and email. If you sign in with Google, we receive your basic profile and email from Google; if you sign up with email, we store your email and a bcrypt-hashed password (never the plaintext).</li>
          <li><strong className="text-white">Profile</strong> — the experience level and target company you set during onboarding.</li>
          <li><strong className="text-white">Your work</strong> — practice progress, notes, revision flags, saved sheets, mentor chat messages, and the submissions and scores from Code Review, Bug Hunt, and Build It.</li>
        </ul>
        <p>We do not collect payment information — the service is free.</p>
      </MarketingSection>

      <MarketingSection title="How we use it">
        <p>
          To run your account, save your progress, grade your submissions, and let the AI mentor tailor its help to
          your context (target company, experience level, and what you&rsquo;ve already done). That&rsquo;s it — no
          advertising, no profiling for third parties.
        </p>
      </MarketingSection>

      <MarketingSection title="Third-party services">
        <p>Codeward relies on a small set of providers to work. Relevant data is sent to them only to deliver the feature you&rsquo;re using:</p>
        <ul className="list-disc ml-5 space-y-1.5 text-neutral-300">
          <li><strong className="text-white">Google</strong> — optional sign-in (OAuth). We use it only to authenticate you; we don&rsquo;t store Google access/refresh tokens.</li>
          <li><strong className="text-white">Groq</strong> — runs the AI mentor and grades your submissions. Your message or submission text is sent to Groq to generate a response.</li>
          <li><strong className="text-white">Voyage AI</strong> — generates the embeddings used for the mentor&rsquo;s knowledge retrieval.</li>
          <li><strong className="text-white">JDoodle</strong> — executes your Build It code when you click &ldquo;Run Tests.&rdquo; The code you submit is sent to JDoodle&rsquo;s sandbox to run.</li>
          <li><strong className="text-white">Neon</strong> — the PostgreSQL database where your account and work are stored.</li>
          <li><strong className="text-white">Upstash</strong> — rate limiting and usage counters.</li>
          <li><strong className="text-white">Vercel</strong> — hosting and privacy-friendly, aggregate analytics.</li>
        </ul>
        <p>Each provider has its own privacy terms governing how it handles the data it receives.</p>
      </MarketingSection>

      <MarketingSection title="Cookies">
        <p>
          We use a single essential cookie to keep you signed in (your authentication session). There are no
          advertising or cross-site tracking cookies.
        </p>
      </MarketingSection>

      <MarketingSection title="Retention & your choices">
        <p>
          Your data is kept while your account is active. You can request that your account and its associated data be
          deleted — email us and it will be removed. Deleting your account cascades to your sheets, notes, chat
          history, and practice attempts.
        </p>
      </MarketingSection>

      <MarketingSection title="Contact">
        <p>
          Questions about privacy? Reach us via the{" "}
          <a href="/contact" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">contact page</a>.
        </p>
      </MarketingSection>
    </MarketingPage>
  );
}
