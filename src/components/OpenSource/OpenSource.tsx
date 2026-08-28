import ScrollReveal from "../ScrollReveal/ScrollReveal";
import "./OpenSource.css";

export default function OpenSource() {
  return (
    <section id="open-source" className="section open-source">
      <div className="container">
        <ScrollReveal>
          <p className="eyebrow">Open Source &amp; Hackathons</p>
          <h2 className="section-heading">No verified contributions or hackathons yet.</h2>
        </ScrollReveal>

        <ScrollReveal delay={60}>
          <p className="open-source__body">
            No open-source contributions, hackathon results, or bounties are claimed here — none exist yet to
            claim. This section stays empty rather than padded, ready to hold real entries (with links to the
            actual PR, repo, or results page) as soon as there's something genuine to add.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <p className="open-source__note">
            The closest thing to it right now: the four Web3 projects above are built and documented in the open,
            in this repository, with real tests and honest "deployment pending" states rather than fabricated
            proof — see the source links on each project page.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
