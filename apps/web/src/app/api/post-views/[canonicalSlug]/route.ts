import { getPublishedLocalizedSlugVariants } from "@/lib/content";
import { getPostViewCount, incrementPostViewCount } from "@/lib/post-views";

interface PostViewParams {
  canonicalSlug: string;
}

async function isKnownCanonicalSlug(canonicalSlug: string): Promise<boolean> {
  const variants = await getPublishedLocalizedSlugVariants(canonicalSlug);
  return variants.length > 0;
}

export async function GET(
  _request: Request,
  context: { params: Promise<PostViewParams> },
): Promise<Response> {
  const params = await context.params;

  if (!(await isKnownCanonicalSlug(params.canonicalSlug))) {
    return Response.json({ message: "Post not found." }, { status: 404 });
  }

  const viewCount = await getPostViewCount(params.canonicalSlug);

  return Response.json({ viewCount });
}

export async function POST(
  _request: Request,
  context: { params: Promise<PostViewParams> },
): Promise<Response> {
  const params = await context.params;

  if (!(await isKnownCanonicalSlug(params.canonicalSlug))) {
    return Response.json({ message: "Post not found." }, { status: 404 });
  }

  const viewCount = await incrementPostViewCount(params.canonicalSlug);

  return Response.json({ viewCount });
}
