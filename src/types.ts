export type Theme = 'light' | 'dark';
export type View = 'library' | 'work' | 'reader';

export interface Work {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  status: string;
  tint: string;
  sortOrder: number;
}

export interface Chapter {
  id: string;
  workId: string;
  chapterNo: number;
  title: string;
  body: string;
  authorNote: string;
}

export interface Comment {
  id: string;
  chapterId: string;
  displayName: string;
  body: string;
  createdAt: string;
}

export interface Resume {
  workId: string;
  chapterNo: number;
  scrollPct: number;
  updatedAt: string;
}

export interface LocalPrefs {
  theme: Theme;
  fs: number;
}
