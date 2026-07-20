"use client";
import { useEffect, useState, useSyncExternalStore } from "react";

const WORDS = ["DSA", "system design", "debugging", "code review"];
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

  return (
    <span className="whitespace-nowrap">
      <span aria-hidden>{visible}</span>
      <span aria-hidden className="motion-safe:animate-pulse">_</span>
      <span className="sr-only">{WORDS[wordIndex]}</span>
    </span>
  );
}
