"use client";
import { useEffect, useState, useSyncExternalStore } from "react";

// Topic form of each mode (reads cleanly after "Master …"), in pill order.
const WORDS = ["DSA", "system design", "code review", "debugging", "low-level design", "distributed systems"];
const TYPE_MS = 90;    // per character, typing in
const DELETE_MS = 50;  // per character, deleting out (backspace reads faster than typing)
const HOLD_MS = 1600;  // pause on the fully-typed word
const GAP_MS = 400;    // pause on empty before the next word starts

const query = "(prefers-reduced-motion: reduce)";
function subscribe(callback: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}
function getSnapshot() {
  return window.matchMedia(query).matches;
}
function getServerSnapshot() {
  return false;
}

/** Classic typewriter loop: types a word out char by char, holds, deletes it
 *  back out, then moves to the next word — forever. Freezes on the first
 *  word, fully typed, under prefers-reduced-motion. */
export default function RotatingWord() {
  // useSyncExternalStore (not a useEffect + setState) is the React-recommended
  // way to read a browser API like matchMedia: it has a built-in, warning-free
  // path for "different value during SSR vs. after hydration" instead of an
  // effect that sets state the moment it runs.
  const reducedMotion = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [wordIndex, setWordIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [phase, setPhase] = useState<"typing" | "deleting">("typing");

  useEffect(() => {
    if (reducedMotion) return;
    const target = WORDS[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (charCount < target.length) {
        timeout = setTimeout(() => setCharCount((c) => c + 1), TYPE_MS);
      } else {
        timeout = setTimeout(() => setPhase("deleting"), HOLD_MS);
      }
    } else {
      if (charCount > 0) {
        timeout = setTimeout(() => setCharCount((c) => c - 1), DELETE_MS);
      } else {
        timeout = setTimeout(() => {
          setWordIndex((i) => (i + 1) % WORDS.length);
          setPhase("typing");
        }, GAP_MS);
      }
    }

    return () => clearTimeout(timeout);
  }, [phase, charCount, wordIndex, reducedMotion]);

  const target = WORDS[wordIndex];
  const visible = reducedMotion ? target : target.slice(0, charCount);

  // The line is centred, so a growing word re-centres the whole headline on
  // every keystroke and drags the copy below it around. Reserving the widest
  // phrase's width up front means the typing happens inside a fixed box and
  // nothing else on the page moves — the box itself is what stays centred
  // under "Master", and the word centres inside it.
  //
  // The reservation is a zero-height, zero-opacity copy of the longest phrase
  // rather than a hardcoded `min-width` in ch or px: it measures in the real
  // rendered font, so it stays correct across breakpoints and if the font
  // falls back.
  const longest = WORDS.reduce((a, b) => (b.length > a.length ? b : a));

  return (
    <span className="relative inline-grid whitespace-nowrap text-center align-bottom">
      <span aria-hidden className="invisible col-start-1 row-start-1 h-0 overflow-hidden">
        {longest}_
      </span>
      <span className="col-start-1 row-start-1">
        <span aria-hidden>{visible}</span>
        <span aria-hidden className="motion-safe:animate-pulse">_</span>
      </span>
      {/* Screen readers get the whole phrase, never the partial string — and
          never a character-by-character announcement. */}
      <span className="sr-only">{WORDS[wordIndex]}</span>
    </span>
  );
}
