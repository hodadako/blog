import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import * as github from "@pulumi/github";
import * as vercel from "@pulumiverse/vercel";

const config = new pulumi.Config();
const domain = config.require("domain");
const cloudflareZoneId = config.require("cloudflareZoneId");
const githubRepository = config.require("githubRepository");
const githubOwner = config.require("githubOwner");
const vercelTeam = config.require("vercelTeam");

const project = new vercel.Project("blog-web", {
  name: "blog-web",
  framework: "nextjs",
  gitRepository: {
    type: "github",
    repo: `${githubOwner}/${githubRepository}`,
  },
  rootDirectory: ".",
  installCommand: "pnpm install --frozen-lockfile",
  buildCommand: "pnpm --filter web build",
  outputDirectory: "apps/web/.next",
  teamId: vercelTeam,
});

new vercel.ProjectDomain("blog-domain", {
  projectId: project.id,
  domain,
  teamId: vercelTeam,
});

new cloudflare.Record("blog-cname", {
  zoneId: cloudflareZoneId,
  name: domain,
  content: "cname.vercel-dns.com",
  type: "CNAME",
  proxied: true,
  ttl: 1,
});

new github.ActionsSecret("quiz-secret", {
  repository: githubRepository,
  secretName: "QUIZ_TOKEN_SECRET",
  plaintextValue: config.requireSecret("quizTokenSecret"),
});

export const projectId = project.id;
