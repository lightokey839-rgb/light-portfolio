import ScrollReveal from "../ScrollReveal/ScrollReveal";
import "./About.css";

const TECHNOLOGIES = [
  "JavaScript",
  "TypeScript",
  "React",
  "Python",
  "Node.js",
  "PostgreSQL",
  "Telegram APIs",
];

const INFO_CARDS = [
  {
    label: "Focus",
    value: "Web3 · Community · Automation · Product",
  },
  {
    label: "Approach",
    value: "Looks good. Works properly. Solves real problems.",
  },
  {
    label: "Mindset",
    value: "Learning by building — improving with every project.",
  },
];

export default function About() {
  return (
    <section id="about" className="section about">
      <div className="container">
        <div className="section-head-row">
          <div>
            <ScrollReveal>
              <p className="eyebrow">About</p>
              <h2 className="section-heading">
                A builder focused on shipping things people actually use.
              </h2>
            </ScrollReveal>
          </div>
        </div>

        <div className="about__grid">
          <div className="about__copy">
            <ScrollReveal>
              <p className="about__lead">
                I'm Light, a <strong>Web3 Developer &amp; Builder</strong> focused
                on creating practical digital products for Web3 projects,
                communities, and startups.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <p>
                I build modern websites, Telegram bots, Telegram Mini Apps, and
                custom Web3 tools designed to help projects establish a stronger
                online presence, engage their communities, and turn ideas into
                functional products.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <p>
                My approach is simple:{" "}
                <strong className="about__highlight">
                  build products that look good, work properly, and solve real
                  problems.
                </strong>{" "}
                Whether it's a token website that needs to build trust, a
                Telegram bot that automates community activities, or a Mini App
                designed around tasks, quests, and engagement, I focus on
                creating experiences that are easy to use and built with the
                project's goals in mind.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={160}>
              <p>
                I'm constantly learning and experimenting with new technologies
                across frontend and backend development, including the tools
                below. I enjoy taking an idea from a rough concept and turning
                it into something people can actually interact with.
              </p>
              <ul className="about__tech-chips">
                {TECHNOLOGIES.map((tech) => (
                  <li key={tech}>{tech}</li>
                ))}
              </ul>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p>
                I'm especially interested in the intersection of{" "}
                <strong className="about__highlight">
                  Web3, community, automation, and product development
                </strong>{" "}
                — building tools that make Web3 projects more useful,
                engaging, and easier to grow.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={240}>
              <p>
                I'm still on the journey of becoming a stronger developer, but
                I'm committed to learning by building, improving with every
                project, and continuously pushing the quality of my work
                higher.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={280}>
              <p className="about__cta-line">
                Have an idea or Web3 project that needs a website, bot, Mini
                App, or custom tool? <strong>Let's build it.</strong>
              </p>
            </ScrollReveal>
          </div>

          <div className="about__cards">
            {INFO_CARDS.map((card, i) => (
              <ScrollReveal key={card.label} delay={i * 100} className="about__card">
                <span className="about__card-label">{card.label}</span>
                <p className="about__card-value">{card.value}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
