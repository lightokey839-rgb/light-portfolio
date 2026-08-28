import { Link } from "react-router-dom";
import type { Project } from "../../lib/api/types";
import { resolveAssetUrl } from "../../lib/api/client";
import ImageFrame from "./ImageFrame";
import "./ProjectCard.css";

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  return (
    <div className="project-card">
      <Link to={`/projects/${project.slug}`} className="project-card__media" tabIndex={-1} aria-hidden="true">
        <span className="project-card__media-index">{String(index + 1).padStart(2, "0")}</span>
        <ImageFrame
          src={resolveAssetUrl(project.imageUrl)}
          alt=""
          seed={project.id}
          ratio="16/10"
          className="project-card__frame"
        />
      </Link>

      <div className="project-card__body">
        <div className="project-card__top">
          <span className="project-card__category">{project.category}</span>
        </div>

        <h3 className="project-card__name">
          <Link to={`/projects/${project.slug}`}>{project.title}</Link>
        </h3>
        <p className="project-card__desc">{project.shortDescription ?? project.description}</p>

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
          {!project.liveUrl && !project.githubUrl && (
            <span className="project-card__soon">No public links yet</span>
          )}
          <Link to={`/projects/${project.slug}`} className="project-card__case-link">
            Case Study →
          </Link>
        </div>
      </div>
    </div>
  );
}
