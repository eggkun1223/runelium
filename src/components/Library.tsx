import type { Chapter, Work } from '../types';
import type { ChapterState } from '../lib/progress';
import styles from './Library.module.css';

interface LibraryProps {
  siteTitle: string;
  themeLabel: string;
  onToggleTheme: () => void;
  works: Work[];
  chaptersByWork: Record<string, Chapter[]>;
  chapterStates: Record<string, ChapterState>;
  hasResume: boolean;
  resumeLabel: string;
  resumePct: number;
  onOpenResume: () => void;
  onOpenWork: (workId: string) => void;
}

function readProgressOf(chapters: Chapter[], chapterStates: Record<string, ChapterState>) {
  const total = chapters.length;
  let lastReadIdx = -1;
  chapters.forEach((c, i) => {
    if (chapterStates[c.id]?.isRead) lastReadIdx = i;
  });
  return {
    label: lastReadIdx === -1 ? '아직 읽지 않음' : `${lastReadIdx + 1} / ${total}화 읽음`,
    pct: lastReadIdx === -1 ? 0 : Math.round(((lastReadIdx + 1) / total) * 100),
  };
}

export function Library({
  siteTitle,
  themeLabel,
  onToggleTheme,
  works,
  chaptersByWork,
  chapterStates,
  hasResume,
  resumeLabel,
  resumePct,
  onOpenResume,
  onOpenWork,
}: LibraryProps) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.overline}>library</div>
          <div className={styles.siteTitle}>{siteTitle}</div>
        </div>
        <button className={styles.themeToggle} onClick={onToggleTheme}>
          {themeLabel}
        </button>
      </div>

      {hasResume && (
        <button className={`unstyled-btn ${styles.resumeCard}`} onClick={onOpenResume}>
          <div className={styles.resumeInfo}>
            <div className={styles.resumeLabel}>이어보기</div>
            <div className={styles.resumeTitle}>{resumeLabel}</div>
          </div>
          <div className={styles.resumePct}>{resumePct}% 읽음 →</div>
        </button>
      )}

      <div className={styles.grid}>
        {works.map((w, idx) => {
          const chapters = chaptersByWork[w.id] ?? [];
          const progress = readProgressOf(chapters, chapterStates);
          return (
            <button
              key={w.id}
              className={`unstyled-btn ${styles.cardWrap}`}
              onClick={() => onOpenWork(w.id)}
            >
              <div className={styles.cover} style={{ background: w.tint }}>
                <div className={styles.coverNo}>{`no. ${String(idx + 1).padStart(2, '0')}`}</div>
                <div className={styles.coverBottom}>
                  <div className={styles.coverTitle}>{w.title}</div>
                  <div className={styles.coverRule} />
                  <div className={styles.coverTagline}>{w.tagline}</div>
                </div>
              </div>
              <div className={styles.readProgress}>
                <div className={styles.readProgressLabel}>{progress.label}</div>
                <div className={styles.readProgressTrack}>
                  <div className={styles.readProgressFill} style={{ width: `${progress.pct}%` }} />
                </div>
              </div>
              <div className={styles.cardMeta}>
                <div className={styles.cardTitle}>{w.title}</div>
                <div className={styles.cardSub}>
                  전 {chapters.length}화 · {w.status}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
