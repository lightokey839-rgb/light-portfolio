import { Link } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import About from "../components/About/About";
import TechStack from "../components/TechStack/TechStack";
import ScrollReveal from "../components/ScrollReveal/ScrollReveal";
import ImageFrame from "../components/shared/ImageFrame";
import { useSiteSettings } from "../context/SiteSettingsContext";
import lightProfileWebp from "../assets/images/light-profile.webp";
import "./AboutPage.css";

const PRINCIPLES = [
  {
    n: "01",
    title: "Ship real, working systems",
    body: "Every Lab experiment runs on live contracts, not mocked screens — if it can't be used, it isn't finished.",
  },
  {
    n: "02",
    title: "Security-first where funds are involved",
    body: "Anything touching a wallet or a payable function gets a written security note, not just a passing test.",
  },
  {
    n: "03",
    title: "Honest empty states over invented ones",
    body: "A section with nothing real to show says so — no placeholder articles, no fabricated case studies.",
  },
  {
    n: "04",
    title: "Community is part of the product",
    body: "Bots and mini apps are built for the people using them day to day, not just for the demo.",
  },
];

export default function AboutPage() {
  const settings = useSiteSettings();

  return (
    <>
      <Navbar />
      <main className="about-page">
        <section className="about-page__hero">
          <div className="container about-page__hero-grid">
            <ScrollReveal>
              <p className="eyebrow">About</p>
              <h1 className="about-page__heading">
                Hi, I'm <span className="text-accent">{settings.name}</span>.
              </h1>
              <p className="about-page__intro">
                {settings.title} — I build the parts of Web3 products people actually touch:
                the front end, the bot in your Telegram group, the mini app, and the systems
                that keep a community running underneath them.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={120} as="div" className="about-page__portrait">
              <ImageFrame
                src={lightProfileWebp}
                alt={`${settings.name} — portrait`}
                ratio="4/3"
                loading="eager"
              />
            </ScrollReveal>
          </div>
        </section>

        <About />

        <section className="section about-page__principles">
          <div className="container">
            <ScrollReveal>
              <p className="eyebrow">How I Work</p>
              <h2 className="section-heading">A few things I hold to on every build.</h2>
            </ScrollReveal>

            <div className="about-page__principles-grid">
              {PRINCIPLES.map((p, i) => (
                <ScrollReveal key={p.n} delay={i * 90} as="div" className="principle-card">
                  <span className="principle-card__n mono-label">{p.n}</span>
                  <h3 className="principle-card__title">{p.title}</h3>
                  <p className="principle-card__body">{p.body}</p>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <TechStack />

        <section className="section about-page__cta">
          <div className="container about-page__cta-inner">
            <ScrollReveal>
              <h2 className="section-heading about-page__cta-heading">
                Want to work together?
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={100} as="div">
              <Link to="/contact" className="btn btn-primary">
                Get in touch →
              </Link>
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
