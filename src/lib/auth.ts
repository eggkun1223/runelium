import { supabase } from './supabaseClient';

// 이메일/비밀번호 없이 이 브라우저만의 익명 방문자 세션을 만들거나 재사용한다.
// 진척률/댓글 작성자 식별에 쓰이며, 개인정보는 전혀 수집하지 않는다.
export async function ensureVisitorId(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user) return sessionData.session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user) throw new Error('익명 로그인에 실패했습니다.');
  return data.user.id;
}
