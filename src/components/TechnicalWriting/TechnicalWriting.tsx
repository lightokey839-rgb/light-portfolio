import ScrollReveal from "../ScrollReveal/ScrollReveal";
import "./TechnicalWriting.css";

// Topics this section is scoped to cover once something is actually
// written and published — explicitly labeled "planned," never presented
// as existing articles. Per the portfolio's "real data only" requirement:
// an empty section that's honest about being empty is correct; a section
// padded with invented article titles is not.
const PLANNED_TOPICS = [
  "Smart-contract security patterns",
  "AMM mathematics & price impact",
  "Gas optimization techniques",
  "Oracle security & staleness handling",
  "Governance attack vectors",
  "NFT marketplace architecture",
];

export default function TechnicalWriting() {
  return (
    <section id="writing" className="section technical-writing">
      <div className="container">
        <ScrollReveal>
          <p className="eyebrow">Technical Writing</p>
          <h2 className="section-heading">Nothing published yet — here's what's planned.</h2>
        </ScrollReveal>

        <ScrollReveal delay={60}>
          <p className="technical-writing__intro">
            No articles are live here yet. Rather than leave the section blank or fill it with placeholder posts,
            here's what it's scoped to cover once something real is written — pulled directly from building the
            four Web3 projects above.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <ul className="technical-writing__topics">
            {PLANNED_TOPICS.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </ScrollReveal>
      </div>
    </section>
  );
}
