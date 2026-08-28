import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listProjects } from "../../lib/api/projects";
import type { Project } from "../../lib/api/types";
import ScrollReveal from "../ScrollReveal/ScrollReveal";
import FeaturedProject from "../shared/FeaturedProject";
import ProjectCard from "../shared/ProjectCard";
import "./Projects.css";

/**
 * Home page preview — one featured case study plus a handful of recent
 * work, then a hand-off to /projects for the full gallery. The full
 * card/filter implementation lives on ProjectsPage; this stays deliberately
 * short so the homepage keeps moving (see homepage content-priority spec).
 */
export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let cancelled = false;
    listProjects({ pageSize: 100 })
      .then((result) => {
        if (!cancelled) setProjects(result.projects);
      })
      .catch((err) => {
        console.error("Failed to load projects:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const featured = projects.filter((p) => p.featured).slice(0, 1);
  const rest = projects.filter((p) => !featured.includes(p)).slice(0, 4);

  return (
    <section id="projects" className="section projects">
      <div className="container">
        <div className="section-head-row">
          <ScrollReveal>
            <p className="eyebrow">02 / Selected Work</p>
            <h2 className="section-heading">A look at the kind of work I build.</h2>
            <p className="section-sub">
              Real screenshots, links, and case studies land here as projects ship — the layout
              is already built to hold them.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100} as="div">
            <Link to="/projects" className="btn btn-ghost">
              View all projects →
            </Link>
          </ScrollReveal>
        </div>

        {featured.length > 0 && (
          <div className="projects__featured">
            {featured.map((project) => (
              <ScrollReveal key={project.id}>
                <FeaturedProject project={project} />
              </ScrollReveal>
            ))}
          </div>
        )}

        <div className="projects__grid">
          {rest.map((project, i) => (
            <ScrollReveal key={project.id} delay={i * 80}>
              <ProjectCard project={project} index={i} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
