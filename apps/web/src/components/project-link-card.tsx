import type {ProjectLinkWithActivity} from "@/lib/projects";
import type {AppLocale} from "@/lib/site";

interface ProjectLinkCardCopy {
  activityUnavailableLabel: string;
}

interface ProjectLinkCardProps {
  project: ProjectLinkWithActivity;
  locale: AppLocale;
  copy: ProjectLinkCardCopy;
  titleLevel?: "h2" | "h3";
}

export function ProjectLinkCard({project, locale, copy, titleLevel = "h2"}: ProjectLinkCardProps) {
  const TitleTag = titleLevel;

  return (
    <article className="post-card post-card--project">
      <a className="post-card__surface" href={project.href}>
        <div className="post-card__content">
          <TitleTag className="post-card__title">{project.title}</TitleTag>
          <p className="post-card__summary">{project.description}</p>
        </div>

        <div className="post-card__aside post-card__aside--project">
          <section className="project-activity" aria-label={`${project.title} activity`}>
            <div className="project-activity__grid" aria-hidden="true">
              {project.activity.days.map((day) => (
                <span
                  key={day.date}
                  className={`project-activity__cell project-activity__cell--level-${day.level}`}
                  title={`${day.date}: ${day.count}`}
                />
              ))}
            </div>

            {project.activity.status === "unavailable" ? (
              <p className="project-activity__note">{copy.activityUnavailableLabel}</p>
            ) : null}
          </section>

          <div className="meta-row">
            <span>{project.period}</span>
          </div>
        </div>
      </a>
    </article>
  );
}
