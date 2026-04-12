import {ProjectLinkCard} from "@/components/project-link-card";
import {getProjects} from "@/lib/projects";
import {buildPageTitle, getDictionary, resolveLocale, resolveRouteParams} from "@/lib/site";

interface ProjectsPageParams {
  locale: string;
}

interface ProjectsPageProps {
  params: Promise<ProjectsPageParams>;
}

export async function generateMetadata({params}: ProjectsPageProps) {
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
  const projects = getProjects(locale);

  return (
    <div className="page-main">
      <section className="page-section">
        <div className="archive-list">
          {projects.map((project) => (
            <ProjectLinkCard key={project.href} project={project} />
          ))}
        </div>
      </section>
    </div>
  );
}
