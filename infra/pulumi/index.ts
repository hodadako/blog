import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import * as github from "@pulumi/github";

const config = new pulumi.Config();
const domain = config.require("domain");
const cloudflareZoneId = config.require("cloudflareZoneId");
const githubRepository = config.require("githubRepository");

new cloudflare.DnsRecord("blog-cname", {
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
