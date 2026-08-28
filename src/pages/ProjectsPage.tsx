import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import ScrollReveal from "../components/ScrollReveal/ScrollReveal";
import FeaturedProject from "../components/shared/FeaturedProject";
import ProjectCard from "../components/shared/ProjectCard";
import SectionHeader from "../components/shared/SectionHeader";
import { listProjects } from "../lib/api/projects";
import type { Project } from "../lib/api/types";
import "./ProjectsPage.css";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listProjects({ pageSize: 100 })
      .then((result) => {
        if (!cancelled) setProjects(result.projects);
      })
      .catch((err) => console.error("Failed to load projects:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
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

  const visible = filter === "All" ? projects : projects.filter((p) => p.category === filter);
  const featured = visible.filter((p) => p.featured);
  const rest = visible.filter((p) => !p.featured);

  return (
    <>
      <Navbar />
      <main className="projects-page">
        <section className="projects-page__hero">
          <div className="container">
            <SectionHeader
              level="h1"
              eyebrow="Projects"
              heading="A digital gallery of what's shipped."
              sub="Web3 front ends, Telegram Mini Apps, and community/reward systems — filtered by category, with a full case study behind each one."
              action={
                categories.length > 1 ? (
                  <div className="projects-page__filters">
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
                  </div>
                ) : undefined
              }
            />
          </div>
        </section>

        <section className="section projects-page__body">
          <div className="container">
            {loading && <p className="projects-page__status mono-label">Loading projects…</p>}

            {!loading && visible.length === 0 && (
              <p className="projects-page__status mono-label">No projects in this category yet.</p>
            )}

            {featured.length > 0 && (
              <div className="projects__featured">
                {featured.map((project, i) => (
                  <ScrollReveal key={project.id} delay={i * 60}>
                    <FeaturedProject project={project} reverse={i % 2 === 1} />
                  </ScrollReveal>
                ))}
              </div>
            )}

            <div className="projects-page__grid">
              {rest.map((project, i) => (
                <ScrollReveal key={project.id} delay={i * 70}>
                  <ProjectCard project={project} index={i} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
