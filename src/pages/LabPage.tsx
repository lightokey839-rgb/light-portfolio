import { Link } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import ScrollReveal from "../components/ScrollReveal/ScrollReveal";
import LabCard from "../components/shared/LabCard";
import GlowGrid from "../components/shared/GlowGrid";
import { labExperiments } from "../data/lab";
import "./LabPage.css";

export default function LabPage() {
  return (
    <>
      <Navbar />
      <main className="lab-page">
        <section className="lab-hero">
          <GlowGrid size={40} opacity={0.7} className="lab-hero__grid" />
          <div className="container lab-hero__inner">
            <ScrollReveal>
              <p className="eyebrow">The Lab</p>
              <h1 className="lab-hero__heading">
                Experimental Web3
                <br />
                systems <span className="text-accent">live here</span>.
              </h1>
              <p className="section-sub lab-hero__sub">
                Four working protocols, each shipped with real Solidity contracts on Sepolia
                testnet — not mockups. Connect a wallet and use them directly: swap tokens, mint
                and trade NFTs, vote on proposals, read a live price feed.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <div className="lab-hero__stats">
                <div className="lab-hero__stat">
                  <span className="big-number">{labExperiments.length}</span>
                  <span className="mono-label">Live experiments</span>
                </div>
                <div className="lab-hero__stat">
                  <span className="big-number">Sepolia</span>
                  <span className="mono-label">Testnet, real contracts</span>
                </div>
                <div className="lab-hero__stat">
                  <span className="big-number">Solidity</span>
                  <span className="mono-label">+ Wagmi / Viem</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="section lab-grid-section">
          <div className="container">
            <ScrollReveal>
              <p className="eyebrow">Choose an experiment</p>
            </ScrollReveal>
            <div className="lab-grid">
              {labExperiments.map((exp, i) => (
                <ScrollReveal key={exp.slug} delay={i * 80} as="div">
                  <LabCard
                    slug={exp.slug}
                    name={exp.name}
                    description={exp.description}
                    status={exp.status}
                    statusLabel={exp.statusLabel}
                    tech={exp.tech}
                    glyph={exp.glyph}
                  />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section lab-note-section">
          <div className="container lab-note">
            <ScrollReveal>
              <p className="eyebrow">Before you connect a wallet</p>
              <h2 className="section-heading lab-note__heading">Testnet only, on purpose.</h2>
              <p className="section-sub lab-note__sub">
                Every experiment above runs on Sepolia testnet — the contracts are real and
                verifiable, but nothing costs real funds. That's deliberate: the Lab exists to
                show working systems and their source, not to take deposits.
              </p>
              <Link to="/opensource" className="btn btn-ghost lab-note__btn">
                See the source →
              </Link>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
