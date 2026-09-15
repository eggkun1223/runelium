import { useEffect, useRef } from 'react';
import { CONFIG } from './config';
import { useLibrary } from './hooks/useLibrary';
import { Gate } from './components/Gate';
import { Library } from './components/Library';
import { WorkDetail } from './components/WorkDetail';
import { Reader } from './components/Reader';
import './App.css';

export default function App() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const c = useLibrary(scrollRef);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', c.theme);
  }, [c.theme]);

  if (c.boot.status === 'loading') {
    return (
      <div className="app-scroll app-status">
        <div>불러오는 중…</div>
      </div>
    );
  }

  if (c.boot.status === 'error') {
    return (
      <div className="app-scroll app-status">
        <div>서재를 불러오지 못했어요. ({c.boot.error})</div>
      </div>
    );
  }

  const resumeEntries = Object.values(c.resumeByWork);
  const latestResume = resumeEntries.length
    ? resumeEntries.reduce((a, b) => (new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b))
    : null;
  const resumeWork = latestResume ? c.works.find((w) => w.id === latestResume.workId) : null;
  const resumeChapters = resumeWork ? (c.chaptersByWork[resumeWork.id] ?? []) : [];
  const resumeCi = latestResume
    ? resumeChapters.findIndex((ch) => ch.chapterNo === latestResume.chapterNo)
    : -1;
  const hasResume = !!(latestResume && resumeWork && resumeCi >= 0);
  const resumeLabel =
    hasResume && resumeWork
      ? `${resumeWork.title} · ${resumeChapters[resumeCi].chapterNo}화 「${resumeChapters[resumeCi].title}」`
      : '';
  const resumePct = latestResume ? Math.max(1, Math.round(latestResume.scrollPct)) : 0;

  const currentWork = c.workId ? c.works.find((w) => w.id === c.workId) : undefined;
  const currentChapters = c.workId ? (c.chaptersByWork[c.workId] ?? []) : [];
  const currentChapter = currentChapters[c.ci];

  const handleScroll =
    c.view === 'reader' && c.workId && currentChapter
      ? c.onReaderScroll(c.workId, currentChapter.chapterNo)
      : undefined;

  return (
    <div ref={scrollRef} className="app-scroll" onScroll={handleScroll}>
      {c.locked ? (
        <Gate
          question={CONFIG.gateQuestion}
          value={c.gateInput}
          onChange={(v) => {
            c.setGateInput(v);
            c.setGateError(false);
          }}
          onSubmit={() => c.submitGate(CONFIG.gateAnswer)}
          error={c.gateError}
        />
      ) : c.view === 'library' ? (
        <Library
          siteTitle={CONFIG.siteTitle}
          themeLabel={c.theme === 'dark' ? '라이트 모드' : '다크 모드'}
          onToggleTheme={c.toggleTheme}
          works={c.works}
          chaptersByWork={c.chaptersByWork}
          chapterStates={c.chapterStates}
          hasResume={hasResume}
          resumeLabel={resumeLabel}
          resumePct={resumePct}
          onOpenResume={() => {
            if (hasResume && resumeWork) c.openChapter(resumeWork.id, resumeCi, resumePct);
          }}
          onOpenWork={(workId) => c.navigate({ view: 'work', workId })}
        />
      ) : c.view === 'work' && currentWork ? (
        <WorkDetail
          work={currentWork}
          chapters={currentChapters}
          chapterStates={c.chapterStates}
          onBack={c.goBack}
          onOpenChapter={(ci) => c.openChapter(currentWork.id, ci)}
        />
      ) : c.view === 'reader' && currentWork && currentChapter ? (
        <Reader
          key={currentChapter.id}
          work={currentWork}
          chapters={currentChapters}
          chapter={currentChapter}
          ci={c.ci}
          fs={c.fs}
          theme={c.theme}
          isBookmarked={!!c.chapterStates[currentChapter.id]?.isBookmarked}
          progress={c.progress}
          visitorId={c.visitorId}
          displayName={c.displayName}
          onBack={c.goBack}
          onFsUp={c.fsUp}
          onFsDown={c.fsDown}
          onToggleMark={c.toggleMark}
          onToggleTheme={c.toggleTheme}
          onPrev={() => {
            if (c.ci > 0) c.openChapter(currentWork.id, c.ci - 1);
          }}
          onNext={() => {
            if (c.ci < currentChapters.length - 1) c.openChapter(currentWork.id, c.ci + 1);
          }}
        />
      ) : null}
    </div>
  );
}
