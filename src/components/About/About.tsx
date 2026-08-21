import ScrollReveal from "../ScrollReveal/ScrollReveal";
import "./About.css";

const CAPABILITIES = [
  "Web3 Development",
  "Telegram Bots",
  "Mini Apps",
  "Community Moderation",
  "UI/UX",
  "Branding",
];

const INFO_CARDS = [
  {
    label: "Web3",
    value: "Smart contracts & Web3 products",
  },
  {
    label: "Bots",
    value: "Telegram automation & community tools",
  },
  {
    label: "Design",
    value: "Modern interfaces & branding",
  },
  {
    label: "Moderation",
    value: "Community support & engagement",
  },
];

export default function About() {
  return (
    <section id="about" className="section about">
      <div className="container">
        <div className="about__grid">
          <div className="about__col about__col-number">
            <ScrollReveal>
              <p className="eyebrow">01 / About</p>
            </ScrollReveal>
          </div>

          <div className="about__col about__col-lead">
            <ScrollReveal>
              <p className="about__lead">
                I'm a <strong>Web3 developer and community moderator</strong>{" "}
                focused on building websites, Telegram bots, mini apps, and
                digital experiences for Web3 projects.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <ul className="about__tech-chips">
                {CAPABILITIES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <p className="about__cta-line">
                Have a Web3 project in mind? <strong>Let's build it.</strong>
              </p>
            </ScrollReveal>
          </div>

          <div className="about__col about__col-info">
            {INFO_CARDS.map((card, i) => (
              <ScrollReveal key={card.label} delay={i * 90} className="about__info-row">
                <span className="about__info-label mono-label">{card.label}</span>
                <p className="about__info-value">{card.value}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
