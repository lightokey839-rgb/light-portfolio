import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import ScrollReveal from "../components/ScrollReveal/ScrollReveal";
import ImageFrame from "../components/shared/ImageFrame";
import ProjectCard from "../components/shared/ProjectCard";
import { getProjectBySlug, listProjects } from "../lib/api/projects";
import { resolveAssetUrl } from "../lib/api/client";
import type { Project } from "../lib/api/types";
import "./ProjectDetailPage.css";

type LoadState = "loading" | "ready" | "not-found";

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [related, setRelated] = useState<Project[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setProject(null);
    setRelated([]);
    window.scrollTo({ top: 0 });

    if (!slug) {
      setState("not-found");
      return;
    }

    getProjectBySlug(slug)
      .then(({ project }) => {
        if (cancelled) return;
        setProject(project);
        setState("ready");

        listProjects({ pageSize: 100 })
          .then(({ projects }) => {
            if (cancelled) return;
            const others = projects.filter((p) => p.id !== project.id);
            const sameCategory = others.filter((p) => p.category === project.category);
            const pool = sameCategory.length > 0 ? sameCategory : others;
            setRelated(pool.slice(0, 3));
          })
          .catch((err) => console.error("Failed to load related projects:", err));
      })
      .catch(() => {
        if (!cancelled) setState("not-found");
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state === "loading") {
    return (
      <>
        <Navbar />
        <main className="project-detail project-detail--loading">
          <div className="container">
            <p className="project-detail__status">Loading project…</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (state === "not-found" || !project) {
    return (
      <>
        <Navbar />
        <main className="project-detail project-detail--loading">
          <div className="container">
            <p className="eyebrow">404</p>
            <h1 className="section-heading">Project not found.</h1>
            <p className="section-sub">
              It may have been unpublished or the link is out of date.
            </p>
            <Link to="/projects" className="btn btn-primary" style={{ marginTop: 28 }}>
              Back to Projects
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const heroImage = resolveAssetUrl(project.imageUrl);

  return (
    <>
      <Navbar />
      <main className="project-detail">
        <header className="project-detail__hero">
          <div className="container">
            <ScrollReveal>
              <Link to="/projects" className="project-detail__back">
                ← All Projects
              </Link>
              <span className="project-detail__category">{project.category}</span>
              <h1 className="project-detail__title">{project.title}</h1>
              {project.shortDescription && (
                <p className="project-detail__lede">{project.shortDescription}</p>
              )}

              <div className="project-detail__actions">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    className="btn btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Live Demo ↗
                  </a>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    className="btn btn-ghost"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Code ↗
                  </a>
                )}
              </div>
            </ScrollReveal>
          </div>
        </header>

        <div className="container">
          <ScrollReveal delay={100}>
            <ImageFrame
              src={heroImage}
              alt={project.title}
              seed={project.id}
              ratio="16/9"
              loading="eager"
              className="project-detail__hero-media"
            />
          </ScrollReveal>
        </div>

        <div className="container project-detail__body">
          <div className="project-detail__main">
            <ScrollReveal as="section" className="project-detail__section">
              <h2>Overview</h2>
              <p>{project.description}</p>
            </ScrollReveal>

            {project.challenge && (
              <ScrollReveal as="section" className="project-detail__section">
                <h2>The Challenge</h2>
                <p>{project.challenge}</p>
              </ScrollReveal>
            )}

            {project.solution && (
              <ScrollReveal as="section" className="project-detail__section">
                <h2>The Solution</h2>
                <p>{project.solution}</p>
              </ScrollReveal>
            )}

            {project.keyFeatures.length > 0 && (
              <ScrollReveal as="section" className="project-detail__section">
                <h2>Key Features</h2>
                <ul className="project-detail__features">
                  {project.keyFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </ScrollReveal>
            )}

            {project.gallery.length > 0 && (
              <ScrollReveal as="section" className="project-detail__section">
                <h2>Gallery</h2>
                <div className="project-detail__gallery">
                  {project.gallery.map((url) => {
                    const resolved = resolveAssetUrl(url);
                    return resolved ? (
                      <ImageFrame
                        key={url}
                        src={resolved}
                        alt={`${project.title} screenshot`}
                        seed={url}
                        ratio="4/3"
                      />
                    ) : null;
                  })}
                </div>
              </ScrollReveal>
            )}

            {project.results && (
              <ScrollReveal as="section" className="project-detail__section">
                <h2>Results &amp; Highlights</h2>
                <p>{project.results}</p>
              </ScrollReveal>
            )}
          </div>

          <aside className="project-detail__aside">
            <ScrollReveal delay={80} className="project-detail__aside-card">
              <h3>Technology</h3>
              <ul className="project-detail__tech">
                {project.technologies.map((tech) => (
                  <li key={tech.id}>{tech.name}</li>
                ))}
              </ul>

              <h3>Links</h3>
              <ul className="project-detail__links">
                {project.liveUrl && (
                  <li>
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                      Live Demo ↗
                    </a>
                  </li>
                )}
                {project.githubUrl && (
                  <li>
                    <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                      GitHub ↗
                    </a>
                  </li>
                )}
                {!project.liveUrl && !project.githubUrl && (
                  <li className="project-detail__links-empty">No public links yet</li>
                )}
              </ul>
            </ScrollReveal>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="section project-detail__related">
            <div className="container">
              <ScrollReveal>
                <p className="eyebrow">Related Work</p>
                <h2 className="section-heading">More from the same category.</h2>
              </ScrollReveal>
              <div className="project-detail__related-grid">
                {related.map((p, i) => (
                  <ScrollReveal key={p.id} delay={i * 80}>
                    <ProjectCard project={p} index={i} />
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="container">
          <Link to="/projects" className="project-detail__back project-detail__back--footer">
            ← Back to all projects
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
