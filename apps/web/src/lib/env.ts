function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "http://localhost:3000",
  contentRoot: process.env.CONTENT_ROOT,
  adminPassword: process.env.ADMIN_PASSWORD,
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET,
  githubToken: process.env.GITHUB_TOKEN,
  githubOwner: process.env.GITHUB_OWNER,
  githubRepo: process.env.GITHUB_REPO,
  githubBranch: process.env.GITHUB_BRANCH ?? "main",
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  commentPepper: process.env.COMMENT_PASSWORD_PEPPER,
  quizSecret: process.env.QUIZ_TOKEN_SECRET,
  quizWorkerUrl: process.env.NEXT_PUBLIC_QUIZ_WORKER_URL,
};

export function requireAdminSecrets(): { password: string; sessionSecret: string } {
  return {
    password: readRequiredEnv("ADMIN_PASSWORD"),
    sessionSecret: readRequiredEnv("ADMIN_SESSION_SECRET"),
  };
}

export function requireGithubConfig(): {
  token: string;
  owner: string;
  repo: string;
  branch: string;
} {
  return {
    token: readRequiredEnv("GITHUB_TOKEN"),
    owner: readRequiredEnv("GITHUB_OWNER"),
    repo: readRequiredEnv("GITHUB_REPO"),
    branch: env.githubBranch,
  };
}

export function requireSupabaseConfig(): { url: string; serviceRoleKey: string } {
  return {
    url: readRequiredEnv("SUPABASE_URL"),
    serviceRoleKey: readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function requireCommentPepper(): string {
  return readRequiredEnv("COMMENT_PASSWORD_PEPPER");
}

export function requireQuizSecret(): string {
  return readRequiredEnv("QUIZ_TOKEN_SECRET");
}
