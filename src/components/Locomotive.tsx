import styles from "./Locomotive.module.css";

type EngineProps = {
  isNight?: boolean;
};

// Layout note: this SVG is authored left-to-right as cab → boiler → chimney
// on purpose. It's placed as the LAST element in the train row (see
// thoughts/page.tsx), so its left edge is what couples to the carriages and
// its right edge leads the train — cab on the left, chimney on the right,
// otherwise the loco would visually run backward into its own train.
export function Engine({ isNight }: EngineProps) {
  return (
    <div className={styles.engineWrap}>
      <svg width="220" height="96" viewBox="0 0 248 108" className={styles.engineSvg}>
        <rect x="6" y="80" width="234" height="8" rx="2" fill="#12161f" />
        <path d="M2,88 L20,88 L14,74 L2,74 Z" fill="#202326" stroke="#12161f" strokeWidth="1" />

        {/* cab */}
        <path d="M18,30 L18,82 L92,82 L92,46 L76,30 Z" fill="#2b2f33" stroke="#12161f" strokeWidth="1.2" />
        <path
          d="M10,30 L10,18 Q10,13 16,13 L70,13 Q80,13 84,20 L92,32 L18,32 Z"
          fill="#4d7c3e"
          stroke="#325427"
          strokeWidth="1"
        />
        <rect
          x="34"
          y="42"
          width="26"
          height="24"
          rx="3"
          className={`${styles.window} ${isNight ? styles.windowLit : ""}`}
        />
        <circle cx="47" cy="38" r="2" fill="#c9a15f" />
        <line x1="47" y1="40" x2="47" y2="44" stroke="#c9a15f" strokeWidth="1.2" />
        <rect x="72" y="72" width="18" height="18" fill="none" stroke="#8a6a34" strokeWidth="1.4" />
        <line x1="72" y1="78" x2="90" y2="78" stroke="#8a6a34" strokeWidth="1.4" />
        <line x1="72" y1="84" x2="90" y2="84" stroke="#8a6a34" strokeWidth="1.4" />

        {/* boiler */}
        <rect x="84" y="44" width="128" height="34" rx="17" fill="#3a3d40" stroke="#12161f" strokeWidth="1.2" />
        <rect x="84" y="44" width="128" height="10" rx="5" fill="#4a4d50" opacity="0.6" />
        <rect x="118" y="44" width="2.5" height="34" fill="#12161f" opacity="0.35" />
        <rect x="160" y="44" width="2.5" height="34" fill="#12161f" opacity="0.35" />

        {/* steam dome + whistle */}
        <path d="M133,44 L133,26 Q133,22 139,22 Q145,22 145,26 L145,44 Z" fill="#202326" stroke="#8a6a34" strokeWidth="1.1" />
        <ellipse cx="139" cy="22" rx="7" ry="2.2" fill="#8a6a34" />
        <line x1="158" y1="44" x2="158" y2="28" stroke="#8a6a34" strokeWidth="1.4" />
        <line x1="158" y1="28" x2="170" y2="28" stroke="#8a6a34" strokeWidth="1.4" />
        <circle cx="170" cy="28" r="2.4" fill="#8a6a34" />

        {/* smokebox + chimney */}
        <rect x="200" y="40" width="30" height="40" rx="4" fill="#202326" stroke="#12161f" strokeWidth="1.2" />
        <circle cx="215" cy="60" r="9" fill="none" stroke="#8a6a34" strokeWidth="1.4" />
        <circle cx="215" cy="60" r="2" fill="#8a6a34" />
        <path d="M206,40 L206,18 Q206,13 213,13 Q220,13 220,18 L220,40 Z" fill="#181b1e" stroke="#8a6a34" strokeWidth="1.3" />
        <ellipse cx="213" cy="13" rx="8.5" ry="2.6" fill="#8a6a34" />

        {/* smoke, drawn in-SVG so it never drifts out of alignment */}
        <g className={styles.smokeGroup}>
          <circle className={styles.puff1} cx="213" cy="8" r="5" fill="#f4efe6" opacity="0.55" />
          <circle className={styles.puff2} cx="213" cy="8" r="4" fill="#f4efe6" opacity="0.5" />
          <circle className={styles.puff3} cx="213" cy="8" r="6" fill="#f4efe6" opacity="0.45" />
        </g>

        {/* buffers + headlamp */}
        <rect x="234" y="58" width="12" height="7" rx="1.5" fill="#12161f" />
        <circle cx="244" cy="61" r="4.4" fill="#12161f" stroke="#8a6a34" strokeWidth="1" />
        <circle cx="228" cy="46" r="4" className={styles.headlamp} />

        {/* wheels + connecting rod */}
        <line x1="106" y1="92" x2="184" y2="92" stroke="#d8d3c4" strokeWidth="3" />
        <circle cx="106" cy="92" r="16" fill="#15181c" stroke="#8a6a34" strokeWidth="2.4" />
        <circle cx="106" cy="92" r="5" fill="#d8d3c4" />
        <circle cx="145" cy="92" r="16" fill="#15181c" stroke="#8a6a34" strokeWidth="2.4" />
        <circle cx="145" cy="92" r="5" fill="#d8d3c4" />
        <circle cx="184" cy="92" r="16" fill="#15181c" stroke="#8a6a34" strokeWidth="2.4" />
        <circle cx="184" cy="92" r="5" fill="#d8d3c4" />
        <circle cx="68" cy="92" r="10" fill="#15181c" stroke="#8a6a34" strokeWidth="1.8" />
        <circle cx="224" cy="92" r="11" fill="#15181c" stroke="#8a6a34" strokeWidth="1.8" />
      </svg>
    </div>
  );
}

type CarriageProps = {
  litCount?: number; // how many windows glow — a quiet way to show "thoughts that day"
  label?: string;
};

export function Carriage({ litCount = 0, label }: CarriageProps) {
  const windows = [0, 1, 2, 3, 4, 5];
  return (
    <div className={styles.carriageWrap}>
      <svg width="118" height="72" viewBox="0 0 96 54" className={styles.carriageSvg}>
        <rect x="2" y="4" width="92" height="5" rx="2" fill="#b7b7b0" />
        <rect x="4" y="6" width="4" height="4" fill="#b7b7b0" />
        <rect x="88" y="6" width="4" height="4" fill="#b7b7b0" />
        <rect x="4" y="8" width="88" height="24" rx="6" fill="#7a2020" stroke="#4a1414" strokeWidth="1" />
        {windows.map((i) => (
          <rect
            key={i}
            x={10 + i * 13}
            y="10"
            width="9"
            height="12"
            rx="2"
            className={`${styles.carWindow} ${i < litCount ? styles.carWindowLit : ""}`}
          />
        ))}
        <rect x="4" y="30" width="88" height="4" fill="#d8b86a" />
        <rect x="4" y="34" width="88" height="10" fill="#4c5a2e" />
        <rect x="0" y="20" width="6" height="16" fill="#d8b86a" />
        <rect x="90" y="20" width="6" height="16" fill="#d8b86a" />
        <circle cx="20" cy="48" r="5" fill="#15181c" stroke="#8a6a34" strokeWidth="1.4" />
        <circle cx="34" cy="48" r="5" fill="#15181c" stroke="#8a6a34" strokeWidth="1.4" />
        <circle cx="62" cy="48" r="5" fill="#15181c" stroke="#8a6a34" strokeWidth="1.4" />
        <circle cx="76" cy="48" r="5" fill="#15181c" stroke="#8a6a34" strokeWidth="1.4" />
      </svg>
      {label && <div className={styles.carriageLabel}>{label}</div>}
    </div>
  );
}
