import { Link } from "react-router-dom";
import { labExperiments } from "../../data/lab";
import "./LabNavigation.css";

interface LabNavigationProps {
  activeSlug: "dex" | "nft" | "dao" | "oracle";
}

/**
 * Mounted directly inside each /lab/:slug page, just under the main
 * Navbar (those pages render their own <Navbar/>, so this is inserted
 * as a sibling rather than via an external wrapper — keeps DOM order
 * correct without touching how each page renders itself otherwise).
 */
export default function LabNavigation({ activeSlug }: LabNavigationProps) {
  const active = labExperiments.find((e) => e.slug === activeSlug);

  return (
    <div className="lab-navigation">
      <div className="container lab-navigation__inner">
        <div className="lab-navigation__crumb">
          <Link to="/lab" className="lab-navigation__back">
            ← Lab
          </Link>
          <span className="lab-navigation__sep">/</span>
          <span className="lab-navigation__current">{active?.shortName ?? activeSlug}</span>
        </div>

        <nav className="lab-navigation__pills" aria-label="Lab experiments">
          {labExperiments.map((exp) => (
            <Link
              key={exp.slug}
              to={`/lab/${exp.slug}`}
              className={`lab-navigation__pill ${exp.slug === activeSlug ? "is-active" : ""}`}
            >
              {exp.shortName}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
