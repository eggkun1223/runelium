import { supabase } from './supabaseClient';
import type { Chapter, Work } from '../types';

export async function fetchWorks(): Promise<Work[]> {
  const { data, error } = await supabase
    .from('works')
    .select('id, slug, title, tagline, status, tint, sort_order')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((w) => ({
    id: w.id,
    slug: w.slug,
    title: w.title,
    tagline: w.tagline,
    status: w.status,
    tint: w.tint,
    sortOrder: w.sort_order,
  }));
}

export async function fetchChaptersByWork(workId: string): Promise<Chapter[]> {
  const { data, error } = await supabase
    .from('chapters')
    .select('id, work_id, chapter_no, title, body, author_note')
    .eq('work_id', workId)
    .order('chapter_no', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    workId: c.work_id,
    chapterNo: c.chapter_no,
    title: c.title,
    body: c.body,
    authorNote: c.author_note,
  }));
}
