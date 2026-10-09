import Link from "next/link";
import Image from "next/image";

/** The browser icon is the single canonical mark; never redraw it as a text R. */
export function BrandMark() {
  return (
    <Image
      src="/favicon.svg"
      width={40}
      height={40}
      alt=""
      aria-hidden="true"
      className="rs-brand-mark"
      unoptimized
    />
  );
}

export function Wordmark({
  inverse = false,
  compact = false,
  className = "",
}: {
  inverse?: boolean;
  compact?: boolean;
  className?: string | undefined;
}) {
  return (
    <Link
      href="/"
      className={`rs-wordmark ${className}`}
      data-tone={inverse ? "inverse" : "default"}
      aria-label="Retrosum home"
    >
      <BrandMark />
      {!compact && (
        <span className="rs-wordmark-name">
          Retro<span className="rs-wordmark-accent">sum.</span>
        </span>
      )}
    </Link>
  );
}
