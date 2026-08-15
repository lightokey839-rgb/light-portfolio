import { useEffect, useMemo, useState } from "react";
import { listProjects } from "../../lib/api/projects";
import type { Project } from "../../lib/api/types";
import { resolveAssetUrl } from "../../lib/api/client";
import ScrollReveal from "../ScrollReveal/ScrollReveal";
import "./Projects.css";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let cancelled = false;

    // No `status` filter — the API already restricts an unauthenticated
    // caller to published projects only, sorted by manual sortOrder.
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

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(projects.map((p) => p.category)))],
    [projects]
  );
  const [filter, setFilter] = useState("All");

  const visible =
    filter === "All" ? projects : projects.filter((p) => p.category === filter);

  return (
    <section id="projects" className="section projects">
      <div className="container">
        <div className="section-head-row">
          <ScrollReveal>
            <p className="eyebrow">Selected Work</p>
            <h2 className="section-heading">
              A look at the kind of work I build.
            </h2>
            <p className="section-sub">
              Real screenshots, links, and case studies land here as projects
              ship — the layout is already built to hold them.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100} className="projects__filters" as="div">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`projects__filter ${filter === cat ? "is-active" : ""}`}
                onClick={() => setFilter(cat)}
                aria-pressed={filter === cat}
              >
                {cat}
              </button>
            ))}
          </ScrollReveal>
        </div>

        <div className="projects__grid">
          {visible.map((project, i) => (
            <ScrollReveal key={project.id} delay={i * 80} className="project-card">
              <div className="project-card__media">
                {project.imageUrl ? (
                  <img
                    src={resolveAssetUrl(project.imageUrl) ?? undefined}
                    alt={project.title}
                    className="project-card__media-img"
                  />
                ) : (
                  <>
                    <span className="project-card__media-index">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="project-card__media-label">
                      Preview coming soon
                    </span>
                  </>
                )}
              </div>

              <div className="project-card__body">
                <div className="project-card__top">
                  <span className="project-card__category">{project.category}</span>
                </div>

                <h3 className="project-card__name">{project.title}</h3>
                <p className="project-card__desc">
                  {project.shortDescription ?? project.description}
                </p>

                <ul className="project-card__tech">
                  {project.technologies.map((tech) => (
                    <li key={tech.id}>{tech.name}</li>
                  ))}
                </ul>

                <div className="project-card__actions">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      className="btn btn-ghost btn-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Live Demo
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      className="btn btn-ghost btn-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub
                    </a>
                  )}
                  {!project.liveUrl && !project.githubUrl && (
                    <span className="project-card__soon">No public links yet</span>
                  )}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
