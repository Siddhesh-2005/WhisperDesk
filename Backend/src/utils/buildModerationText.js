export function buildModerationText(post) {
  if (!post || typeof post !== "object") {
    throw new Error("Post object required");
  }

  const title = post.title?.trim() || "";
  const content = post.content?.trim() || "";

  const text = [title, content].filter(Boolean).join("\n\n");

  if (!text) {
    throw new Error("Post has no text to moderate");
  }

  return text;
}
