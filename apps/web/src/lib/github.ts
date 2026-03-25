import { Buffer } from "node:buffer";
import type { GithubContentFile, GithubWriteResult } from "@/lib/types";
import { requireGithubConfig } from "@/lib/env";

function buildContentsUrl(pathname: string, branch: string): string {
  const { owner, repo } = requireGithubConfig();
  const encodedPath = pathname.split("/").map(encodeURIComponent).join("/");
  return `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;
}

export async function getGithubFile(pathname: string): Promise<GithubContentFile | null> {
  const config = requireGithubConfig();
  const response = await fetch(buildContentsUrl(pathname, config.branch), {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to read GitHub file: ${response.status}`);
  }

  const payload = (await response.json()) as { sha: string; content: string; encoding: string };
  const content = payload.encoding === "base64" ? Buffer.from(payload.content, "base64").toString("utf8") : payload.content;

  return {
    sha: payload.sha,
    content,
  };
}

export async function writeGithubFile(params: {
  pathname: string;
  content: string;
  message: string;
  sha?: string;
}): Promise<GithubWriteResult> {
  const config = requireGithubConfig();
  const response = await fetch(buildContentsUrl(params.pathname, config.branch).replace(/\?ref=.*$/, ""), {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      branch: config.branch,
      message: params.message,
      content: Buffer.from(params.content, "utf8").toString("base64"),
      sha: params.sha,
    }),
  });

  if (response.status === 409) {
    throw new Error("GitHub content update conflict. Refresh and retry.");
  }

  if (!response.ok) {
    throw new Error(`Failed to write GitHub file: ${response.status}`);
  }

  const payload = (await response.json()) as {
    content: { sha: string };
    commit: { sha: string };
  };

  return {
    fileSha: payload.content.sha,
    commitSha: payload.commit.sha,
  };
}
