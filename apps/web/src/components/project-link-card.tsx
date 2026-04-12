import type {ProjectLink} from "@/lib/projects";

interface ProjectLinkCardProps {
  project: ProjectLink;
  titleLevel?: "h2" | "h3";
}

export function ProjectLinkCard({project, titleLevel = "h2"}: ProjectLinkCardProps) {
  const TitleTag = titleLevel;

  return (
    <article className="post-card">
      <a className="post-card__surface" href={project.href}>
        <div className="post-card__content">
          <TitleTag className="post-card__title">{project.title}</TitleTag>
          <p className="post-card__summary">{project.description}</p>
        </div>

        <div className="post-card__aside">
          <div className="meta-row">
            <span>{project.period}</span>
          </div>
        </div>
      </a>
    </article>
  );
}
