import { Link } from "react-router-dom";
import type { Project } from "../../lib/api/types";
import { resolveAssetUrl } from "../../lib/api/client";
import ImageFrame from "./ImageFrame";
import "./FeaturedProject.css";

interface FeaturedProjectProps {
  project: Project;
  reverse?: boolean;
}

export default function FeaturedProject({ project, reverse = false }: FeaturedProjectProps) {
  return (
    <div className={`project-feature ${reverse ? "project-feature--reverse" : ""}`}>
      <Link to={`/projects/${project.slug}`} className="project-feature__media" tabIndex={-1} aria-hidden="true">
        <ImageFrame
          src={resolveAssetUrl(project.imageUrl)}
          alt=""
          seed={project.id}
          ratio="16/10"
          className="project-feature__frame"
        />
      </Link>

      <div className="project-feature__body">
        <span className="project-feature__category">{project.category} · Featured</span>
        <h3 className="project-feature__name">
          <Link to={`/projects/${project.slug}`}>{project.title}</Link>
        </h3>
        <p className="project-feature__desc">{project.shortDescription ?? project.description}</p>

        {project.keyFeatures.length > 0 && (
          <ul className="project-feature__list">
            {project.keyFeatures.slice(0, 4).map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        )}

        {project.technologies.length > 0 && (
          <ul className="project-card__tech">
            {project.technologies.map((tech) => (
              <li key={tech.id}>{tech.name}</li>
            ))}
          </ul>
        )}

        <div className="project-card__actions">
          {project.liveUrl && (
            <a href={project.liveUrl} className="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer">
              Live Demo
            </a>
          )}
          {project.githubUrl && (
            <a href={project.githubUrl} className="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          )}
          <Link to={`/projects/${project.slug}`} className="btn btn-primary btn-sm">
            Case Study
          </Link>
        </div>
      </div>
    </div>
  );
}
