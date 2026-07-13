export interface CommunityPost {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  rating: number;
  reviewCount: number;
  placeCount: number;
  region: string;
  thumbnail: string;
  tags: string[];
  description?: string;
}

const POSTS_KEY = "historytravel:community-posts";

function readPosts(): CommunityPost[] {
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writePosts(posts: CommunityPost[]) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

export function getUserPosts(): CommunityPost[] {
  return readPosts();
}

export function addUserPost(post: CommunityPost) {
  writePosts([post, ...readPosts()]);
}

export function removeUserPost(id: string) {
  writePosts(readPosts().filter((p) => p.id !== id));
}
