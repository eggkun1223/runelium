import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { CONFIG } from '../config';
import { addComment, fetchComments } from '../lib/comments';
import { formatRelativeTime } from '../lib/format';
import type { Chapter, Comment, Theme, Work } from '../types';
import styles from './Reader.module.css';

interface ReaderProps {
  work: Work;
  chapters: Chapter[];
  chapter: Chapter;
  ci: number;
  fs: number;
  theme: Theme;
  isBookmarked: boolean;
  progress: number;
  visitorId: string | null;
  displayName: string | null;
  onBack: () => void;
  onFsUp: () => void;
  onFsDown: () => void;
  onToggleMark: (chapterId: string) => void;
  onToggleTheme: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function markdownComponents(fs: number, lh: number): Components {
  const pStyle = { margin: 0, fontSize: `${fs}px`, lineHeight: lh, letterSpacing: '-0.003em' };
  return {
    p: ({ node: _node, ...props }) => <p style={pStyle} {...props} />,
    li: ({ node: _node, ...props }) => <li style={{ fontSize: `${fs}px`, lineHeight: lh }} {...props} />,
    blockquote: ({ node: _node, ...props }) => <blockquote className={styles.quote} {...props} />,
    hr: () => <div className={styles.sceneBreak} />,
    h1: ({ node: _node, ...props }) => <h1 className={styles.heading1} {...props} />,
    h2: ({ node: _node, ...props }) => <h2 className={styles.heading2} {...props} />,
    h3: ({ node: _node, ...props }) => <h3 className={styles.heading3} {...props} />,
    ul: ({ node: _node, ...props }) => <ul className={styles.list} {...props} />,
    ol: ({ node: _node, ...props }) => <ol className={styles.list} {...props} />,
  };
}

export function Reader({
  work,
  chapters,
  chapter,
  ci,
  fs,
  theme,
  isBookmarked,
  progress,
  visitorId,
  displayName,
  onBack,
  onFsUp,
  onFsDown,
  onToggleMark,
  onToggleTheme,
  onPrev,
  onNext,
}: ReaderProps) {
  const lh = fs >= 20 ? 2.0 : 2.1;
  const paraGap = Math.round(fs * 1.1);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchComments(chapter.id)
      .then((list) => {
        if (!cancelled) setComments(list);
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [chapter.id]);

  const handleAddComment = async () => {
    const text = commentInput.trim();
    if (!text || !visitorId || !displayName || submitting) return;
    setSubmitting(true);
    try {
      const created = await addComment(visitorId, chapter.id, displayName, text);
      setComments((prev) => [...prev, created]);
      setCommentInput('');
    } catch {
      /* 네트워크 오류 시 조용히 무시 — 입력값은 유지됨 */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className={styles.stickyBar}>
        <div className={styles.stickyInner}>
          <button className={styles.backBtn} onClick={onBack} aria-label="작품 상세로">
            ←
          </button>
          <div className={styles.stickyMid}>
            <div className={styles.stickyTitle}>{chapter.title}</div>
            <div className={styles.stickyCrumb}>
              {work.title} · {chapters.length}화 중 {ci + 1}
            </div>
          </div>
          <div className={styles.controls}>
            <button
              className={styles.ctrlBtn}
              onClick={onFsDown}
              aria-label="글자 작게"
              style={{ fontSize: 12 }}
            >
              A-
            </button>
            <button
              className={styles.ctrlBtn}
              onClick={onFsUp}
              aria-label="글자 크게"
              style={{ fontSize: 15 }}
            >
              A+
            </button>
            <button
              className={styles.ctrlBtn}
              onClick={() => onToggleMark(chapter.id)}
              aria-label={isBookmarked ? '북마크 해제' : '북마크'}
              aria-pressed={isBookmarked}
              style={{ background: isBookmarked ? 'rgba(143,95,102,0.14)' : 'transparent' }}
            >
              {isBookmarked ? '★' : '☆'}
            </button>
            <button
              className={styles.ctrlBtn}
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${Math.round(progress)}%` }} />
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.chapterHead}>
          <div className={styles.chapterNo}>{ci + 1}화</div>
          <div className={styles.chapterTitle}>{chapter.title}</div>
        </div>

        <div className={styles.paragraphs} style={{ gap: `${paraGap}px` }}>
          <ReactMarkdown remarkPlugins={[remarkBreaks]} components={markdownComponents(fs, lh)}>
            {chapter.body}
          </ReactMarkdown>
        </div>

        {chapter.authorNote && (
          <div className={styles.noteCard}>
            <div className={styles.noteLabel}>작가의 말</div>
            <div className={styles.noteBody}>{chapter.authorNote}</div>
          </div>
        )}

        <div className={styles.navRow}>
          <button
            className={styles.navBtn}
            onClick={onPrev}
            disabled={ci === 0}
            style={{ opacity: ci > 0 ? 1 : 0.35 }}
          >
            ← 이전 회차
          </button>
          <button
            className={styles.navBtn}
            onClick={onNext}
            disabled={ci >= chapters.length - 1}
            style={{ opacity: ci < chapters.length - 1 ? 1 : 0.35 }}
          >
            다음 회차 →
          </button>
        </div>

        {CONFIG.showComments && (
          <div className={styles.commentsSection}>
            <div className={styles.commentsHeader}>
              <div className={styles.commentsLabel}>댓글</div>
              <div className={styles.commentsCount}>{commentsLoading ? '·' : comments.length}</div>
            </div>
            <div className={styles.commentForm}>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="이 회차에 남기고 싶은 말"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
              />
              <button
                className={styles.commentSubmit}
                onClick={handleAddComment}
                disabled={submitting || !visitorId || !displayName}
              >
                남기기
              </button>
            </div>
            <div className={styles.commentList}>
              {comments.map((cm) => (
                <div key={cm.id} className={styles.commentRow}>
                  <div className={styles.commentMeta}>
                    <div className={styles.commentName}>{cm.displayName}</div>
                    <div className={styles.commentWhen}>{formatRelativeTime(cm.createdAt)}</div>
                  </div>
                  <div className={styles.commentText}>{cm.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
