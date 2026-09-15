import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { Chapter, LocalPrefs, Resume, Theme, View, Work } from '../types';
import { ensureVisitorId } from '../lib/auth';
import { ensureAuthorNumber } from '../lib/authorNumber';
import { fetchChaptersByWork, fetchWorks } from '../lib/content';
import {
  fetchAllChapterStates,
  fetchAllProgress,
  upsertChapterState,
  upsertProgress,
  type ChapterState,
} from '../lib/progress';

const PREFS_KEY = 'ff.prefs.v1';

function loadPrefs(): LocalPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { theme: 'light', fs: 17 };
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      fs: typeof parsed.fs === 'number' ? parsed.fs : 17,
    };
  } catch {
    return { theme: 'light', fs: 17 };
  }
}

function savePrefs(prefs: LocalPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export interface NavigateOptions {
  view: View;
  workId?: string | null;
  ci?: number;
  /** 0-100, "이어보기"로 진입할 때만 쓰는 스크롤 위치(비율). 그 외엔 항상 0(맨 위). */
  scrollTo?: number;
}

export type BootStatus = 'loading' | 'ready' | 'error';

export function useLibrary(scrollRef: RefObject<HTMLDivElement | null>) {
  const [prefs] = useState(loadPrefs);
  const [theme, setTheme] = useState<Theme>(prefs.theme);
  const [fs, setFs] = useState(prefs.fs);
  const [authorNumber, setAuthorNumber] = useState<number | null>(null);

  const [locked, setLocked] = useState(true);
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState(false);

  const [view, setView] = useState<View>('library');
  const [workId, setWorkId] = useState<string | null>(null);
  const [ci, setCi] = useState(0);
  const [progress, setProgress] = useState(0);

  const [boot, setBoot] = useState<{ status: BootStatus; error?: string }>({ status: 'loading' });
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [works, setWorks] = useState<Work[]>([]);
  const [chaptersByWork, setChaptersByWork] = useState<Record<string, Chapter[]>>({});
  const [chapterStates, setChapterStates] = useState<Record<string, ChapterState>>({});
  const [resumeByWork, setResumeByWork] = useState<Record<string, Resume>>({});

  const pendingRestore = useRef<number>(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  // 익명 세션 확보 → 작품/회차 → 이 방문자의 진척률을 한 번에 불러온다.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vid = await ensureVisitorId();
        const fetchedWorks = await fetchWorks();
        const chapterLists = await Promise.all(
          fetchedWorks.map((w) => fetchChaptersByWork(w.id))
        );
        const byWork: Record<string, Chapter[]> = {};
        fetchedWorks.forEach((w, i) => {
          byWork[w.id] = chapterLists[i];
        });
        const [states, resumes, authorNo] = await Promise.all([
          fetchAllChapterStates(vid),
          fetchAllProgress(vid),
          ensureAuthorNumber(vid),
        ]);
        if (cancelled) return;
        setVisitorId(vid);
        setWorks(fetchedWorks);
        setChaptersByWork(byWork);
        setChapterStates(states);
        setResumeByWork(resumes);
        setAuthorNumber(authorNo);
        setBoot({ status: 'ready' });
      } catch (e) {
        if (!cancelled) {
          setBoot({ status: 'error', error: e instanceof Error ? e.message : String(e) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 진입/이동할 때마다 스크롤 위치를 복원(비율 기반, 이어보기 외엔 항상 0).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const max = el.scrollHeight - el.clientHeight;
      el.scrollTop = max > 0 ? (pendingRestore.current / 100) * max : 0;
      pendingRestore.current = 0;
    }
  }, [view, workId, ci, scrollRef]);

  const applyNav = useCallback((opts: NavigateOptions) => {
    setView(opts.view);
    if (opts.workId !== undefined) setWorkId(opts.workId);
    if (opts.ci !== undefined) setCi(opts.ci);
    pendingRestore.current = opts.scrollTo ?? 0;
  }, []);

  const navigate = useCallback(
    (opts: NavigateOptions) => {
      applyNav(opts);
      const nextWorkId = opts.workId !== undefined ? opts.workId : workId;
      const nextCi = opts.ci !== undefined ? opts.ci : ci;
      window.history.pushState({ view: opts.view, workId: nextWorkId, ci: nextCi }, '');
    },
    [applyNav, workId, ci]
  );

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ view: 'library', workId: null, ci: 0 }, '');
    }
    const onPopState = (e: PopStateEvent) => {
      const state = e.state as NavigateOptions | null;
      applyNav(state ?? { view: 'library', workId: null, ci: 0 });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [applyNav]);

  const submitGate = useCallback(
    (answer: string) => {
      const ok = gateInput.trim().replace(/\s/g, '') === answer.trim().replace(/\s/g, '');
      if (ok) {
        setLocked(false);
        setGateError(false);
        setGateInput('');
      } else {
        setGateError(true);
      }
    },
    [gateInput]
  );

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === 'dark' ? 'light' : 'dark';
      savePrefs({ theme: next, fs });
      return next;
    });
  }, [fs]);

  const fsUp = useCallback(() => {
    setFs((v) => {
      const next = Math.min(24, v + 1);
      savePrefs({ theme, fs: next });
      return next;
    });
  }, [theme]);

  const fsDown = useCallback(() => {
    setFs((v) => {
      const next = Math.max(14, v - 1);
      savePrefs({ theme, fs: next });
      return next;
    });
  }, [theme]);

  const openChapter = useCallback(
    (targetWorkId: string, targetCi: number, scrollToPct?: number) => {
      navigate({ view: 'reader', workId: targetWorkId, ci: targetCi, scrollTo: scrollToPct ?? 0 });
      setProgress(0);
      const chapter = chaptersByWork[targetWorkId]?.[targetCi];
      if (!chapter || !visitorId) return;
      setChapterStates((prev) => {
        const current = prev[chapter.id];
        if (current?.isRead) return prev;
        upsertChapterState(visitorId, chapter.id, { isRead: true }, current).catch(() => {});
        return { ...prev, [chapter.id]: { isRead: true, isBookmarked: current?.isBookmarked ?? false } };
      });
    },
    [navigate, chaptersByWork, visitorId]
  );

  const toggleMark = useCallback(
    (chapterId: string) => {
      if (!visitorId) return;
      setChapterStates((prev) => {
        const current = prev[chapterId] ?? { isRead: false, isBookmarked: false };
        const next = { ...current, isBookmarked: !current.isBookmarked };
        upsertChapterState(visitorId, chapterId, { isBookmarked: next.isBookmarked }, current).catch(
          () => {}
        );
        return { ...prev, [chapterId]: next };
      });
    },
    [visitorId]
  );

  const onReaderScroll = useCallback(
    (workIdAtScroll: string, chapterNoAtScroll: number) => (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const max = el.scrollHeight - el.clientHeight;
      const pct = max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0;
      setProgress(pct);
      const nextResume: Resume = {
        workId: workIdAtScroll,
        chapterNo: chapterNoAtScroll,
        scrollPct: pct,
        updatedAt: new Date().toISOString(),
      };
      setResumeByWork((prev) => ({ ...prev, [workIdAtScroll]: nextResume }));
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (visitorId) upsertProgress(visitorId, workIdAtScroll, chapterNoAtScroll, pct).catch(() => {});
      }, 400);
    },
    [visitorId]
  );

  return {
    boot,
    visitorId,
    works,
    chaptersByWork,
    chapterStates,
    resumeByWork,
    locked,
    theme,
    fs,
    displayName: authorNumber != null ? `미루꾸${authorNumber}` : null,
    view,
    workId,
    ci,
    progress,
    gateInput,
    gateError,
    setGateInput,
    setGateError,
    submitGate,
    toggleTheme,
    fsUp,
    fsDown,
    openChapter,
    toggleMark,
    onReaderScroll,
    navigate,
    goBack,
  };
}

export type LibraryController = ReturnType<typeof useLibrary>;
