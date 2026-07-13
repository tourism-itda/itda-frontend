export interface BookmarkedPlace {
  id: string;
  name: string;
  category: string;
  image: string;
  address?: string;
  hours?: string;
}

const STORAGE_KEY = "historytravel:bookmarks";

function readAll(): BookmarkedPlace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(places: BookmarkedPlace[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
}

export function getBookmarks(): BookmarkedPlace[] {
  return readAll();
}

export function isBookmarked(id: string): boolean {
  return readAll().some((p) => p.id === id);
}

// 저장 상태를 뒤집고, 뒤집은 후의 저장 여부를 반환한다
export function toggleBookmark(place: BookmarkedPlace): boolean {
  const all = readAll();
  const exists = all.some((p) => p.id === place.id);
  writeAll(exists ? all.filter((p) => p.id !== place.id) : [place, ...all]);
  return !exists;
}

export function removeBookmark(id: string) {
  writeAll(readAll().filter((p) => p.id !== id));
}
