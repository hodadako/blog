import { deleteComment, updateComment } from "@/lib/comments";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const params = await context.params;
  const formData = await request.formData();
  const intent = readString(formData, "intent");
  const password = readString(formData, "password");
  const content = readString(formData, "content");
  const redirectTo = readString(formData, "redirectTo");

  if (intent === "edit") {
    await updateComment({ commentId: params.id, password, content });
  } else if (intent === "delete") {
    await deleteComment({ commentId: params.id, password });
  } else {
    throw new Error("Unsupported comment action.");
  }

  return Response.redirect(new URL(redirectTo || "/ko/blog", request.url), 303);
}
