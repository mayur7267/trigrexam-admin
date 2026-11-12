/** Small flat illustrations in the brand palette, used for empty and "all done" states. */

const Star = ({ x, y, s = 1, c = "var(--color-warn-dot)" }: { x: number; y: number; s?: number; c?: string }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0-9C1 -3 3 -1 9 0 3 1 1 3 0 9-1 3-3 1-9 0-3-1-1-3 0-9Z" fill={c} />
);

export function IllusCaughtUp() {
  return (
    <svg viewBox="0 0 200 150" className="mx-auto h-32 w-auto" aria-hidden fill="none">
      <circle cx="100" cy="80" r="62" fill="var(--color-sky-50)" />
      <circle cx="100" cy="80" r="46" fill="var(--color-sky-100)" opacity="0.5" />
      <rect x="58" y="32" width="84" height="98" rx="13" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="2" />
      <rect x="80" y="23" width="40" height="17" rx="7" fill="var(--color-navy)" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx="77" cy={62 + i * 26} r="8" fill="var(--color-ok)" />
          <path d={`M73 ${62 + i * 26} l3 3.2 5.4-6.4`} stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="92" y={58 + i * 26} width={38 - i * 8} height="8" rx="4" fill="var(--color-line)" />
        </g>
      ))}
      <Star x={158} y={44} s={1.15} />
      <Star x={44} y={70} s={0.8} c="var(--color-sky)" />
      <Star x={150} y={112} s={0.7} c="var(--color-violet)" />
    </svg>
  );
}

export function IllusSearch() {
  return (
    <svg viewBox="0 0 200 150" className="mx-auto h-32 w-auto" aria-hidden fill="none">
      <circle cx="100" cy="80" r="62" fill="var(--color-sky-50)" />
      <rect x="50" y="40" width="92" height="84" rx="13" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="2" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="62" y={54 + i * 24} width="20" height="14" rx="5" fill={["var(--color-sky-100)", "var(--color-violet-soft)", "var(--color-amber-soft)"][i]} />
          <rect x="90" y={55 + i * 24} width={42 - i * 8} height="5" rx="2.5" fill="var(--color-line)" />
          <rect x="90" y={64 + i * 24} width={26 - i * 4} height="4" rx="2" fill="var(--color-line)" opacity="0.7" />
        </g>
      ))}
      <circle cx="132" cy="102" r="22" fill="var(--color-surface)" fillOpacity="0.85" stroke="var(--color-navy)" strokeWidth="5" />
      <path d="M148 118l18 18" stroke="var(--color-navy)" strokeWidth="7" strokeLinecap="round" />
      <path d="M122 102h20" stroke="var(--color-sky)" strokeWidth="3.5" strokeLinecap="round" />
      <Star x={46} y={46} s={0.9} />
      <Star x={164} y={52} s={0.7} c="var(--color-sky)" />
    </svg>
  );
}

export function IllusInbox() {
  return (
    <svg viewBox="0 0 200 150" className="mx-auto h-32 w-auto" aria-hidden fill="none">
      <circle cx="100" cy="82" r="62" fill="var(--color-sky-50)" />
      <path d="M52 88l20-34a8 8 0 017-4h42a8 8 0 017 4l20 34v28a10 10 0 01-10 10H62a10 10 0 01-10-10V88z" fill="var(--color-surface)" stroke="var(--color-line-strong)" strokeWidth="2" />
      <path d="M52 88h34a6 6 0 016 6 8 8 0 008 8h0a8 8 0 008-8 6 6 0 016-6h34" stroke="var(--color-line-strong)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M118 36l38-14-14 38-9-14z" fill="var(--color-navy)" />
      <path d="M133 46l23-24" stroke="var(--color-sky)" strokeWidth="3" strokeLinecap="round" />
      <path d="M96 60c-14 4-30 4-36-2" stroke="var(--color-sky)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 7" />
      <Star x={46} y={52} s={0.85} c="var(--color-sky)" />
      <Star x={160} y={104} s={0.9} />
    </svg>
  );
}

export const ILLUSTRATIONS = { caught: IllusCaughtUp, search: IllusSearch, inbox: IllusInbox } as const;
export type IllusName = keyof typeof ILLUSTRATIONS;
