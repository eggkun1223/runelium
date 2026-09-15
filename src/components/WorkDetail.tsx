import type { Chapter, Work } from '../types';
import type { ChapterState } from '../lib/progress';
import styles from './WorkDetail.module.css';

interface WorkDetailProps {
  work: Work;
  chapters: Chapter[];
  chapterStates: Record<string, ChapterState>;
  onBack: () => void;
  onOpenChapter: (ci: number) => void;
}

export function WorkDetail({ work, chapters, chapterStates, onBack, onOpenChapter }: WorkDetailProps) {
  const hasAnyRead = chapters.some((c) => chapterStates[c.id]?.isRead);
  const cta = hasAnyRead ? '이어서 읽기' : '1화부터 읽기';

  const readFirstUnread = () => {
    const idx = chapters.findIndex((c) => !chapterStates[c.id]?.isRead);
    onOpenChapter(idx === -1 ? 0 : idx);
  };

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={onBack}>
        ← 서재
      </button>

      <div className={styles.topBlock}>
        <div className={styles.miniCover} style={{ background: work.tint }}>
          <div className={styles.miniCoverTitle}>{work.title}</div>
          <div className={styles.miniCoverRule} />
        </div>
        <div className={styles.infoCol}>
          <div className={styles.title}>{work.title}</div>
          <div className={styles.tagline}>{work.tagline}</div>
          <div className={styles.pills}>
            <span className={styles.pillStatus}>{work.status}</span>
            <span className={styles.pillMeta}>전 {chapters.length}화</span>
          </div>
          <button className={styles.cta} onClick={readFirstUnread}>
            {cta}
          </button>
        </div>
      </div>

      <div className={styles.chapterSection}>
        <div className={styles.chapterHeader}>회차</div>
        {chapters.map((chapter, i) => {
          const state = chapterStates[chapter.id];
          return (
            <button
              key={chapter.id}
              className={`unstyled-btn ${styles.chapterRow}`}
              onClick={() => onOpenChapter(i)}
            >
              <div className={styles.chapterNo}>{i + 1}화</div>
              <div className={styles.chapterTitle}>{chapter.title}</div>
              <div className={styles.chapterRight}>
                <div className={styles.chapterSub}>{state?.isRead ? '읽음' : '아직 읽지 않음'}</div>
                {state?.isBookmarked && <div className={styles.chapterBadge}>북마크</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
