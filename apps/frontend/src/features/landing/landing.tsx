import Image from "next/image";
import Link from "next/link";
import { Wordmark } from "../../components/ui/wordmark";
import { ScrollToSection } from "../../components/ui/scroll-to-section";
import { adoptionEvidence } from "./adoption-evidence";
import { HeroTypewriter } from "./hero-typewriter";
import { PaperLanding } from "./paper-landing";
import { RetroPreview } from "./product-preview";
import styles from "./landing.module.css";

export function Landing() {
  return (
    <PaperLanding>
      <section className={styles.hero} aria-labelledby="hero-title">
        <Image
          src="/images/office-paperwork.webp"
          alt=""
          fill
          sizes="100vw"
          preload
          className={styles.heroPhoto}
        />
        <div className={styles.heroScrim} />
        <header className={styles.navigation}>
          <Wordmark inverse />
          <nav aria-label="Main navigation">
            <ScrollToSection targetId="how-it-works">How it works</ScrollToSection>
            <ScrollToSection targetId="retro">Meet Retro</ScrollToSection>
          </nav>
          <Link href="/demo" className={styles.navCta}>
            Explore demo <span aria-hidden="true">↗</span>
          </Link>
        </header>
        <div className={styles.heroContent}>
          <p className="rs-eyebrow">
            <span className={styles.heroDot} aria-hidden="true" />
            <HeroTypewriter />
          </p>
          <h1 id="hero-title">
            Your finances.
            <br />
            <span>In focus.</span>
          </h1>
          <p className={styles.heroLead}>
            Your documents hold the story.
            <br className={styles.desktopBreak} /> Let’s make it easier to see.
          </p>
          <div className={styles.heroActions}>
            <Link className="rs-button" data-variant="light" href="/demo">
              Explore demo{" "}
              <span className="rs-arrow" aria-hidden="true">
                ↗
              </span>
            </Link>
            <Link className={styles.textCta} href="/demo">
              Use my documents <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <p className={styles.heroTrust}>
            No account needed. A temporary workspace. Your next clear picture.
          </p>
        </div>
        <div className={styles.heroFooter}>
          <span>Documents. Insights. A little help from Retro.</span>
          <ScrollToSection targetId="how-it-works" aria-label="Discover how Retrosum works">
            <span>Discover a clearer view</span>
            <span aria-hidden="true">↓</span>
          </ScrollToSection>
        </div>
      </section>
      <section
        className={`${styles.paperScene} ${styles.firstSheet}`}
        id="how-it-works"
        aria-labelledby="how-title"
        data-paper-sheet
      >
        <div className={styles.paperSurface}>
          <div className={styles.section}>
            <div className={styles.sectionHeading} data-paper-heading>
              <div>
                <span className="rs-eyebrow">From everyday paperwork to a bigger picture</span>
                <h2 id="how-title">
                  Less sorting.
                  <br />
                  More understanding.
                </h2>
              </div>
              <p>
                Turn invoices, receipts and payment records into a clear view of your business. Read
                the details, explore the numbers, and move forward with Retro.
              </p>
            </div>
            <div className={styles.pillars}>
              <article className={styles.pillar}>
                <span className={styles.pillarNumber}>01 / Read</span>
                <div className={styles.documentIcon} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <b>$</b>
                </div>
                <h3>The details, brought together.</h3>
                <p>
                  Different layouts. Scanned pages. A handwriting example. See the original, review
                  its interpretation, and keep the numbers traceable.
                </p>
              </article>
              <article className={styles.pillar}>
                <span className={styles.pillarNumber}>02 / Understand</span>
                <div className={styles.barsIcon} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <h3>Your money, with meaning.</h3>
                <p>
                  Income, costs, profit and cash, in one connected picture. Explore a chart or open
                  a figure to understand what contributed to it.
                </p>
              </article>
              <article className={styles.pillar}>
                <span className={styles.pillarNumber}>03 / Work with Retro</span>
                <div className={styles.retroIcon} aria-hidden="true">
                  ✳
                </div>
                <h3>A helpful next step.</h3>
                <p>
                  Get a summary, take a guided tour, or prepare a new invoice. Review every change
                  before it touches your session records.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>
      <section
        className={`${styles.paperScene} ${styles.inkSheet}`}
        id="industry"
        aria-labelledby="industry-title"
        data-paper-sheet
      >
        <div className={styles.paperSurface}>
          <div className={`${styles.section} ${styles.evidenceSection}`}>
            <div className={styles.sectionHeading} data-paper-heading>
              <div>
                <span className="rs-eyebrow">A shift already taking shape</span>
                <h2 id="industry-title">
                  Finance is becoming
                  <br />
                  more digital. More assisted.
                </h2>
              </div>
              <p>
                AI adoption and digital payments are growing across finance. These different
                measures show the direction of travel; they do not measure paperless-document
                adoption.
              </p>
            </div>
            <div className={styles.evidencePanel}>
              <div className={styles.evidenceGrid}>
                {adoptionEvidence.map((fact) => (
                  <article key={fact.id}>
                    <span className={`${styles.statNumber} rs-numeral`}>{fact.value}</span>
                    <h3>{fact.heading}</h3>
                    <p>{fact.scope}</p>
                    <a
                      href={fact.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${fact.source} primary source, opens in a new tab`}
                    >
                      {fact.source} <span aria-hidden="true">↗</span>
                    </a>
                  </article>
                ))}
              </div>
              <div className={styles.industryExamples}>
                <span className="rs-eyebrow">Examples across the industry</span>
                <p>
                  <strong>Morgan Stanley</strong> announced AI meeting summaries in June 2024.{" "}
                  <strong>Intuit</strong> introduced accounting, payment and finance agents in July
                  2025. Company examples; no affiliation with Retrosum.
                </p>
                <a
                  href="https://investors.intuit.com/news-events/press-releases/detail/1258/intuit-introduces-ground-breaking-virtual-team-of-ai-agents-to-fuel-growth-for-businesses"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Intuit announcement <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section
        className={`${styles.paperScene} ${styles.afterInkSheet}`}
        id="retro"
        aria-labelledby="retro-title"
        data-paper-sheet
      >
        <div className={styles.paperSurface}>
          <div className={`${styles.section} ${styles.retroSection}`}>
            <div data-paper-heading>
              <span className="rs-eyebrow">Meet Retro, your copilot</span>
              <h2 id="retro-title">
                Make sense of it.
                <br />
                Then make a move.
              </h2>
              <p className={styles.sectionLead}>
                Ask for an explanation. Follow a tour. Turn a request into an editable invoice or
                expense. A conversation that helps you get things done.
              </p>
              <Link className={styles.inlineLink} href="/demo">
                Meet Retro in the workspace <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div data-paper-follow>
              <RetroPreview />
            </div>
          </div>
        </div>
      </section>
      <section
        className={`${styles.paperScene} ${styles.forestSheet}`}
        aria-labelledby="final-title"
        data-paper-sheet
      >
        <div className={styles.paperSurface}>
          <div className={`${styles.section} ${styles.finalSection}`}>
            <div data-paper-heading>
              <span className="rs-eyebrow">A clear place to begin</span>
              <h2 id="final-title">
                Start with a document.
                <br />
                Leave with a clearer picture.
              </h2>
            </div>
            <p>
              No sign-up. Explore the fictional sample or bring your own English-language USD PDFs.
            </p>
            <div className={styles.finalActions} data-paper-follow>
              <Link className="rs-button" data-variant="warm" href="/demo">
                Explore demo <span aria-hidden="true">↗</span>
              </Link>
              <Link className="rs-button" data-variant="ghost" href="/demo">
                Use my documents
              </Link>
            </div>
            <details className={styles.privacy}>
              <summary>How your temporary workspace works</summary>
              <p>
                Records and document previews stay in this browser tab and survive refresh for up to
                two hours. Documents are processed only when you choose to process them. You can
                download the original PDFs or clear your session at any time.
              </p>
            </details>
          </div>
        </div>
      </section>
      <footer className={`${styles.paperScene} ${styles.footerSheet}`} data-paper-sheet>
        <div className={styles.paperSurface}>
          <div className={styles.footer}>
            <Wordmark />
            <p>A little less paperwork. A little more perspective.</p>
          </div>
        </div>
      </footer>
    </PaperLanding>
  );
}
