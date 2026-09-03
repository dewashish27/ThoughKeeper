// Pure presentation helper: turns a Date into a continuously-interpolated
// sky (no hard cuts between "day" and "night"), plus a short poetic line.
// Nothing here touches the network or any app state — it's derived purely
// from the clock already ticking in the Thoughts page.

type Stop = {
  hour: number;
  top: string;
  bottom: string;
  starOpacity: number;
  quip: string;
};

const PALETTE: Stop[] = [
  { hour: 0, top: "#0b1220", bottom: "#1c2c4a", starOpacity: 1, quip: "The world is quiet. Even trains rest their thoughts." },
  { hour: 5, top: "#16233d", bottom: "#3a4668", starOpacity: 0.55, quip: "First light. Something is stirring." },
  { hour: 8, top: "#2a4a72", bottom: "#e8b98a", starOpacity: 0, quip: "A new stretch of track. What comes to mind?" },
  { hour: 12, top: "#3f7ab0", bottom: "#bfe0ee", starOpacity: 0, quip: "Midday clarity — a good time to think out loud." },
  { hour: 16, top: "#3a5a86", bottom: "#e0a76a", starOpacity: 0, quip: "The light is turning gold. So are some ideas." },
  { hour: 19, top: "#1f2a4a", bottom: "#d9788f", starOpacity: 0.35, quip: "Evening. A good hour to look back at today." },
  { hour: 22, top: "#0e1424", bottom: "#2a2540", starOpacity: 0.9, quip: "The train slows its thoughts, but keeps moving." },
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const lerp = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${lerp(ar, br)}, ${lerp(ag, bg)}, ${lerp(ab, bb)})`;
}

export type SkyState = {
  skyTop: string;
  skyBottom: string;
  starOpacity: number;
  celestialOpacity: number; // sun/moon glow strength
  isNight: boolean;
  quip: string;
};

export function skyStateFor(date: Date): SkyState {
  const hourFloat = date.getHours() + date.getMinutes() / 60;

  let i = 0;
  for (let k = 0; k < PALETTE.length; k++) {
    if (hourFloat >= PALETTE[k].hour) i = k;
  }
  const cur = PALETTE[i];
  const next = PALETTE[(i + 1) % PALETTE.length];
  const nextHour = next.hour > cur.hour ? next.hour : next.hour + 24;
  const t = Math.min(1, Math.max(0, (hourFloat - cur.hour) / (nextHour - cur.hour)));

  return {
    skyTop: mix(cur.top, next.top, t),
    skyBottom: mix(cur.bottom, next.bottom, t),
    starOpacity: cur.starOpacity + (next.starOpacity - cur.starOpacity) * t,
    celestialOpacity: hourFloat > 5.5 && hourFloat < 20 ? 0.35 : 1,
    isNight: hourFloat < 6 || hourFloat > 19,
    quip: cur.quip,
  };
}
