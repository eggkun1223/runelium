import { supabase } from './supabaseClient';

// 방문자마다 "미루꾸1", "미루꾸2" ... 식으로 고정된 댓글 작성자 번호를 부여한다.
// 처음 방문 시 한 번 배정되면 이후에는 항상 같은 번호를 돌려준다.
export async function ensureAuthorNumber(visitorId: string): Promise<number> {
  const { data: existing, error: selectError } = await supabase
    .from('comment_authors')
    .select('seq')
    .eq('visitor_id', visitorId)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return existing.seq;

  const { error: insertError } = await supabase
    .from('comment_authors')
    .upsert({ visitor_id: visitorId }, { onConflict: 'visitor_id', ignoreDuplicates: true });
  if (insertError) throw insertError;

  const { data: created, error: refetchError } = await supabase
    .from('comment_authors')
    .select('seq')
    .eq('visitor_id', visitorId)
    .single();
  if (refetchError) throw refetchError;
  return created.seq;
}
