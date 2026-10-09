"use client";
import { useEffect, useState } from "react";
import styles from "./landing.module.css";

const phrase = "A better way to handle your finances";
const letters = [...phrase].map((letter, position) => ({ letter, id: `hero-letter-${position}` }));
const entranceDelay = 720;
const letterInterval = 50;

export function HeroTypewriter() {
  const [visibleCount, setVisibleCount] = useState<number | null>(null);

  useEffect(() => {
    const startsAt = Date.now() + entranceDelay;
    let timer: number;
    const reveal = () => {
      const elapsed = Date.now() - startsAt;
      const count = Math.min(letters.length, Math.max(0, Math.floor(elapsed / letterInterval) + 1));
      setVisibleCount(count);
      if (count < letters.length) {
        timer = window.setTimeout(
          reveal,
          Math.max(1, startsAt + count * letterInterval - Date.now()),
        );
      }
    };
    timer = window.setTimeout(reveal, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <span className={styles.heroAccessible}>{phrase}</span>
      <span className={styles.heroTypewriter} aria-hidden="true">
        {letters.map(({ letter, id }, index) => (
          <span
            className={styles.heroLetter}
            key={id}
            data-visible={visibleCount === null || index < visibleCount}
            data-caret={
              visibleCount !== null && visibleCount < letters.length && index === visibleCount - 1
            }
          >
            {letter === " " ? "\u00a0" : letter}
          </span>
        ))}
      </span>
    </>
  );
}
