import { Link } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import Hero from "../components/Hero/Hero";
import Projects from "../components/Projects/Projects";
import Services from "../components/Services/Services";
import TechStack from "../components/TechStack/TechStack";
import ScrollReveal from "../components/ScrollReveal/ScrollReveal";
import MagneticButton from "../components/shared/MagneticButton";
import { labExperiments } from "../data/lab";
import "./HomePage.css";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Projects />

        <section className="section lab-preview">
          <div className="container">
            <div className="section-head-row">
              <ScrollReveal>
                <p className="eyebrow">03 / The Lab</p>
                <h2 className="section-heading">Experimental protocols, running live.</h2>
                <p className="section-sub">
                  Four working Web3 systems on Sepolia testnet — connect a wallet and try them.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={100} as="div">
                <Link to="/lab" className="btn btn-ghost">
                  Enter the Lab →
                </Link>
              </ScrollReveal>
            </div>

            <div className="lab-preview__row">
              {labExperiments.map((exp, i) => (
                <ScrollReveal key={exp.slug} delay={i * 70} as="div">
                  <MagneticButton strength={8}>
                    <Link to={`/lab/${exp.slug}`} className="lab-preview__chip">
                      <span className="lab-preview__chip-glyph" aria-hidden="true">
                        {exp.glyph}
                      </span>
                      <span className="lab-preview__chip-name">{exp.shortName}</span>
                      <span className="status-chip status-chip--live">{exp.statusLabel}</span>
                    </Link>
                  </MagneticButton>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <Services />
        <TechStack />
      </main>
      <Footer />
    </>
  );
}
