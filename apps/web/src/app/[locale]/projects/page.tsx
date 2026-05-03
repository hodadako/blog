import {ProjectLinkCard} from "@/components/project-link-card";
import {getProjectsWithActivity} from "@/lib/projects";
import {buildPageTitle, getDictionary, resolveLocale, resolveRouteParams} from "@/lib/site";
import type {Metadata} from "next";

interface ProjectsPageParams {
  locale: string;
}

interface ProjectsPageProps {
  params: Promise<ProjectsPageParams>;
}

export async function generateMetadata({params}: ProjectsPageProps): Promise<Metadata> {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const dictionary = getDictionary(locale);

  return {
    title: buildPageTitle(locale, dictionary.projectsPage.heading),
    description: dictionary.projectsPage.intro,
  };
}

export default async function ProjectsPage({params}: ProjectsPageProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const dictionary = getDictionary(locale);
  const projects = await getProjectsWithActivity(locale);

  return (
    <div className="page-main">
      <section className="page-section">
        <div className="archive-list">
          {projects.map((project) => (
            <ProjectLinkCard
              key={project.href}
              locale={locale}
              project={project}
              copy={dictionary.projectsPage}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
