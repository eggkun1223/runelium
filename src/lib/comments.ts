import { supabase } from './supabaseClient';
import type { Comment } from '../types';

export async function fetchComments(chapterId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, chapter_id, display_name, body, created_at')
    .eq('chapter_id', chapterId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    chapterId: c.chapter_id,
    displayName: c.display_name,
    body: c.body,
    createdAt: c.created_at,
  }));
}

export async function addComment(
  visitorId: string,
  chapterId: string,
  displayName: string,
  body: string
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ visitor_id: visitorId, chapter_id: chapterId, display_name: displayName, body })
    .select('id, chapter_id, display_name, body, created_at')
    .single();
  if (error) throw error;
  return {
    id: data.id,
    chapterId: data.chapter_id,
    displayName: data.display_name,
    body: data.body,
    createdAt: data.created_at,
  };
}
