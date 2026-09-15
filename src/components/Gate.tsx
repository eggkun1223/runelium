import styles from './Gate.module.css';

interface GateProps {
  question: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error: boolean;
}

export function Gate({ question, value, onChange, onSubmit, error }: GateProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.column}>
        <div className={styles.mascotRow}>
          <img className={styles.mascot} src={`${import.meta.env.BASE_URL}gate.gif`} alt="" />
          <img className={styles.mascot} src={`${import.meta.env.BASE_URL}gate2.gif`} alt="" />
        </div>
        <div className={styles.labelGroup}>
          <div className={styles.overline}>private library</div>
          <div className={styles.rule} />
        </div>
        <div className={styles.copyGroup}>
          <div className={styles.question}>{question}</div>
          <div className={styles.hint}>아는 사람만 들어올 수 있는 서재예요. 답을 적어주세요.</div>
        </div>
        <div className={styles.formGroup}>
          <input
            className={styles.input}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmit();
            }}
            placeholder="답 입력"
            aria-label="입장 질문 답"
          />
          <button className={styles.submit} onClick={onSubmit}>
            서재로 들어가기
          </button>
          {error && <div className={styles.error}>그 답은 아니에요. 다시 한 번 생각해볼까요?</div>}
        </div>
      </div>
    </div>
  );
}
