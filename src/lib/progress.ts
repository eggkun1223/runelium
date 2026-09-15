import { supabase } from './supabaseClient';
import type { Resume } from '../types';

export interface ChapterState {
  isRead: boolean;
  isBookmarked: boolean;
}

export async function fetchAllProgress(visitorId: string): Promise<Record<string, Resume>> {
  const { data, error } = await supabase
    .from('reader_progress')
    .select('work_id, chapter_no, scroll_pct, updated_at')
    .eq('visitor_id', visitorId);
  if (error) throw error;
  const map: Record<string, Resume> = {};
  for (const row of data ?? []) {
    map[row.work_id] = {
      workId: row.work_id,
      chapterNo: row.chapter_no,
      scrollPct: row.scroll_pct,
      updatedAt: row.updated_at,
    };
  }
  return map;
}

export async function upsertProgress(
  visitorId: string,
  workId: string,
  chapterNo: number,
  scrollPct: number
): Promise<void> {
  const { error } = await supabase.from('reader_progress').upsert(
    {
      visitor_id: visitorId,
      work_id: workId,
      chapter_no: chapterNo,
      scroll_pct: scrollPct,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'visitor_id,work_id' }
  );
  if (error) throw error;
}

export async function fetchAllChapterStates(
  visitorId: string
): Promise<Record<string, ChapterState>> {
  const { data, error } = await supabase
    .from('reader_chapter_state')
    .select('chapter_id, is_read, is_bookmarked')
    .eq('visitor_id', visitorId);
  if (error) throw error;
  const map: Record<string, ChapterState> = {};
  for (const row of data ?? []) {
    map[row.chapter_id] = { isRead: row.is_read, isBookmarked: row.is_bookmarked };
  }
  return map;
}

export async function upsertChapterState(
  visitorId: string,
  chapterId: string,
  patch: Partial<ChapterState>,
  current: ChapterState | undefined
): Promise<void> {
  const next = {
    is_read: patch.isRead ?? current?.isRead ?? false,
    is_bookmarked: patch.isBookmarked ?? current?.isBookmarked ?? false,
  };
  const { error } = await supabase.from('reader_chapter_state').upsert(
    { visitor_id: visitorId, chapter_id: chapterId, ...next, updated_at: new Date().toISOString() },
    { onConflict: 'visitor_id,chapter_id' }
  );
  if (error) throw error;
}
