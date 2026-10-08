import Image from "next/image";
import Link from "next/link";
import { Wordmark } from "../../components/ui/wordmark";
import { RuntimeStatus } from "../runtime/runtime-status";
import { adoptionEvidence } from "./adoption-evidence";
import { DashboardPreview, RetroPreview } from "./product-preview";
import styles from "./landing.module.css";

export function Landing() {
  return (
    <main id="main" tabIndex={-1}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <Image
          src="/images/office.webp"
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
            <a href="#how-it-works">How it works</a>
            <a href="#dashboard">The dashboard</a>
            <a href="#retro">Meet Retro</a>
          </nav>
          <Link href="/workspace?entry=sample#documents" className={styles.navCta}>
            Explore demo <span aria-hidden="true">↗</span>
          </Link>
        </header>
        <div className={styles.heroContent}>
          <p className="rs-eyebrow">
            <span className={styles.heroDot} /> A clearer way to work with money
          </p>
          <h1 id="hero-title">
            Paperwork in.
            <br />
            <span>Clarity out.</span>
          </h1>
          <p className={styles.heroLead}>
            Your documents hold the story.
            <br className={styles.desktopBreak} /> Let’s make it easier to see.
          </p>
          <div className={styles.heroActions}>
            <Link
              className="rs-button"
              data-variant="light"
              href="/workspace?entry=sample#documents"
            >
              Explore the sample business{" "}
              <span className="rs-arrow" aria-hidden="true">
                ↗
              </span>
            </Link>
            <Link className={styles.textCta} href="/workspace?entry=upload#documents">
              Use my documents <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <p className={styles.heroTrust}>
            No account needed. A temporary workspace. Your next clear picture.
          </p>
        </div>
        <div className={styles.heroFooter}>
          <span>Documents. Insights. A little help from Retro.</span>
          <a href="#how-it-works" aria-label="Discover how Retrosum works">
            <span>Discover a clearer view</span>
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>
      <div className={styles.modeBanner}>
        <span>Retrosum · A hands-on finance demo</span>
        <RuntimeStatus />
      </div>
      <section className={styles.section} id="how-it-works" aria-labelledby="how-title">
        <div className={styles.sectionHeading}>
          <div>
            <span className="rs-eyebrow">From everyday paperwork to a bigger picture</span>
            <h2 id="how-title">
              Less sorting.
              <br />
              More understanding.
            </h2>
          </div>
          <p>
            Turn invoices, receipts and payment records into a clear view of your business. Read the
            details, explore the numbers, and move forward with Retro.
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
              Different layouts. Scanned pages. A handwriting example. See the original, review its
              interpretation, and keep the numbers traceable.
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
              Income, costs, profit and cash, in one connected picture. Explore a chart or open a
              figure to understand what contributed to it.
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
      </section>
      <section
        className={`${styles.section} ${styles.dashboardSection}`}
        id="dashboard"
        aria-labelledby="dashboard-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <span className="rs-eyebrow">Numbers that invite a closer look</span>
            <h2 id="dashboard-title">
              A little clarity
              <br />
              goes a long way.
            </h2>
          </div>
          <p>
            A beautiful overview is just the start. Your dashboard will connect every figure to its
            records, and every record to the page it came from.
          </p>
        </div>
        <DashboardPreview />
        <div className={styles.traceability}>
          <span>One figure.</span>
          <span aria-hidden="true">↗</span>
          <span>The records behind it.</span>
          <span aria-hidden="true">↗</span>
          <span>The original document.</span>
        </div>
      </section>
      <section
        className={`${styles.section} ${styles.documentsSection}`}
        id="sample"
        aria-labelledby="sample-title"
      >
        <div className={styles.collectionArt} aria-hidden="true">
          <div className={styles.backPaper} />
          <div className={styles.frontPaper}>
            <div className={styles.paperLogo}>
              Harbor
              <br />
              <span>Studio</span>
            </div>
            <span className={styles.paperTag}>INVOICE / HS-101</span>
            <div className={styles.paperLines}>
              <i />
              <i />
              <i />
            </div>
            <div className={styles.paperTotal}>
              <small>Total / USD</small>
              <strong>$3,000.00</strong>
            </div>
            <div className={styles.paperStamp}>Fictional sample</div>
          </div>
          <span className={styles.collectionCount}>8 PDFs · One connected business</span>
        </div>
        <div>
          <span className="rs-eyebrow">Meet Harbor Studio</span>
          <h2 id="sample-title">
            Realistic paperwork.
            <br />A fictional business.
          </h2>
          <p className={styles.sectionLead}>
            A small studio. A month of work. Invoices, bills, receipts and payment records, in
            varied layouts you can explore.
          </p>
          <ul className={styles.collectionList}>
            <li>Invoices & supplier bills</li>
            <li>Printed & handwriting-style receipts</li>
            <li>Payment register & comparison month</li>
          </ul>
          <Link className="rs-button" href="/workspace?entry=sample#documents">
            Explore sample documents <span aria-hidden="true">↗</span>
          </Link>
          <p className={styles.smallPrint}>
            All eight original PDFs are viewable before processing.
          </p>
        </div>
      </section>
      <section
        className={`${styles.section} ${styles.retroSection}`}
        id="retro"
        aria-labelledby="retro-title"
      >
        <div>
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
          <Link className={styles.inlineLink} href="/workspace">
            Meet Retro in the workspace <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <RetroPreview />
      </section>
      <section
        className={`${styles.section} ${styles.evidenceSection}`}
        id="industry"
        aria-labelledby="industry-title"
      >
        <div className={styles.sectionHeading}>
          <div>
            <span className="rs-eyebrow">A shift already taking shape</span>
            <h2 id="industry-title">
              Finance is becoming
              <br />
              more digital. More assisted.
            </h2>
          </div>
          <p>
            AI adoption and digital payments are growing across finance. These different measures
            show the direction of travel; they do not measure paperless-document adoption.
          </p>
        </div>
        <div className={styles.evidenceGrid}>
          {adoptionEvidence.map((fact) => (
            <article key={fact.id}>
              <span className={styles.statNumber}>{fact.value}</span>
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
            <strong>Intuit</strong> introduced accounting, payment and finance agents in July 2025.
            Company examples; no affiliation with Retrosum.
          </p>
          <a
            href="https://investors.intuit.com/news-events/press-releases/detail/1258/intuit-introduces-ground-breaking-virtual-team-of-ai-agents-to-fuel-growth-for-businesses"
            target="_blank"
            rel="noopener noreferrer"
          >
            Intuit announcement <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
      <section className={`${styles.section} ${styles.finalSection}`} aria-labelledby="final-title">
        <span className="rs-eyebrow">A clear place to begin</span>
        <h2 id="final-title">
          Start with a document.
          <br />
          Leave with a clearer picture.
        </h2>
        <p>No sign-up. Explore the fictional sample or bring your own English-language USD PDFs.</p>
        <div className={styles.finalActions}>
          <Link className="rs-button" data-variant="warm" href="/workspace?entry=sample#documents">
            Explore the sample business <span aria-hidden="true">↗</span>
          </Link>
          <Link className="rs-button" data-variant="ghost" href="/workspace?entry=upload#documents">
            Use my documents
          </Link>
        </div>
        <details className={styles.privacy}>
          <summary>How your temporary workspace works</summary>
          <p>
            Records and document previews stay in this browser tab and survive refresh for up to two
            hours. Selected PDFs are sent for AI processing only when you choose to process them in
            live mode. Retrosum does not keep a hosted document library. Development simulation
            sends no documents to an AI provider. You can export your work or clear your session.
          </p>
        </details>
      </section>
      <footer className={styles.footer}>
        <Wordmark />
        <p>A little less paperwork. A little more perspective.</p>
        <a
          href="https://www.pexels.com/photo/modern-interior-design-of-a-business-office-7534224/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Office photography by Max Vakhtbovych / Pexels
        </a>
        <span>English · USD · A fictional finance demo</span>
      </footer>
    </main>
  );
}
