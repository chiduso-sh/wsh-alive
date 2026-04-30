// Client-safe version — fetches from API instead of reading filesystem
export async function getAllPostsClient(category?: string) {
  const url = category ? `/api/posts?category=${category}` : "/api/posts";
  const res = await fetch(url);
  return res.json();
}
