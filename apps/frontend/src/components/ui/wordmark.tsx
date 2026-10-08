import Link from "next/link";
export function Wordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className="rs-wordmark"
      data-tone={inverse ? "inverse" : "default"}
      aria-label="Retrosum home"
    >
      Retro<span>sum.</span>
    </Link>
  );
}
