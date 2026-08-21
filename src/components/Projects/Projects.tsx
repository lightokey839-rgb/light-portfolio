import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

  // Flagship projects get the large showcase treatment (spec section 12);
  // everything else stays in the compact grid below it.
  const featured = visible.filter((p) => p.featured);
  const rest = visible.filter((p) => !p.featured);

  return (
    <section id="projects" className="section projects">
      <div className="container">
        <div className="section-head-row">
          <ScrollReveal>
            <p className="eyebrow">02 / Selected Work</p>
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

        {featured.length > 0 && (
          <div className="projects__featured">
            {featured.map((project) => (
              <ScrollReveal key={project.id} className="project-feature">
                <div className="project-feature__media">
                  {project.imageUrl ? (
                    <img
                      src={resolveAssetUrl(project.imageUrl) ?? undefined}
                      alt={project.title}
                      className="project-feature__media-img"
                    />
                  ) : (
                    <span className="project-feature__media-label">
                      Preview coming soon
                    </span>
                  )}
                </div>

                <div className="project-feature__body">
                  <span className="project-feature__category">
                    {project.category} · Featured
                  </span>
                  <h3 className="project-feature__name">{project.title}</h3>
                  <p className="project-feature__desc">
                    {project.shortDescription ?? project.description}
                  </p>

                  {project.keyFeatures.length > 0 && (
                    <ul className="project-feature__list">
                      {project.keyFeatures.slice(0, 4).map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  )}

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
                    <Link to={`/projects/${project.slug}`} className="btn btn-primary btn-sm">
                      Case Study
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}

        <div className="projects__grid">
          {rest.map((project, i) => (
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
                  <Link to={`/projects/${project.slug}`} className="project-card__case-link">
                    Case Study →
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
