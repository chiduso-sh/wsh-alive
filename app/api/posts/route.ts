import { getAllPosts } from "@/lib/posts";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") || undefined;
  const posts = getAllPosts(category);
  return NextResponse.json(posts);
}
