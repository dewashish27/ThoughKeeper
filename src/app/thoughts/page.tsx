"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { skyStateFor } from "@/lib/timeOfDay";
import { Engine, Carriage } from "@/components/Locomotive";
import {
  CompassIcon,
  HeartIcon,
  ClockIcon,
  DotsIcon,
  PlusIcon,
  ImageIcon,
  MicIcon,
} from "@/components/icons";

import styles from "./page.module.css";

type Thought = {
  id: string;
  text: string;
  mood: string | null;
  status: string;
  captured_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
};

const moods = [
  "happy",
  "calm",
  "excited",
  "neutral",
  "sad",
  "frustrated",
  "anxious",
  "motivated",
  "tired",
];

const moodSymbols: Record<string, string> = {
  happy: "☀",
  calm: "◌",
  excited: "✦",
  neutral: "○",
  sad: "☂",
  frustrated: "◒",
  anxious: "◌",
  motivated: "↑",
  tired: "◐",
};

// Purely presentational — groups the thoughts already in memory by day, so
// the two carriages behind the engine can reflect "yesterday" / "the day
// before" the same way the rest of the journey metaphor does. Reads only
// from state that's already been fetched; no new API calls.
function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}

function relativeDayLabel(key: string, todayKeyVal: string) {
  const diff = Math.round(
    (new Date(todayKeyVal).getTime() - new Date(key).getTime()) / 86400000
  );
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}

export default function ThoughtsPage() {
  const router = useRouter();

  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [text, setText] = useState("");
  const [mood, setMood] = useState("neutral");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showCapture, setShowCapture] = useState(false);
  const [selectedThought, setSelectedThought] =
    useState<Thought | null>(null);

  const [currentTime, setCurrentTime] = useState(
    new Date()
  );

  // Cosmetic-only: briefly highlights the newest card after a capture.
  // Doesn't affect what gets saved or fetched, purely a visual cue.
  const [justCapturedId, setJustCapturedId] = useState<string | null>(null);

  /*
   * ---------------------------------------
   * CLOCK
   * ---------------------------------------
   */

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /*
   * ---------------------------------------
   * LOAD THOUGHTS
   * ---------------------------------------
   */

  const loadThoughts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiFetch("/thoughts");

      setThoughts(data);
    } catch (error) {
      console.error(error);

      if (
        error instanceof Error &&
        error.message === "Not authenticated"
      ) {
        router.push("/login");
        return;
      }

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load thoughts."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThoughts();
  }, []);

  /*
   * ---------------------------------------
   * CREATE THOUGHT
   * ---------------------------------------
   */

  const createThought = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!text.trim()) return;

    try {
      setCreating(true);
      setError("");
      setMessage("");

      const newThought = await apiFetch(
        "/thoughts",
        {
          method: "POST",
          body: JSON.stringify({
            text: text.trim(),
            mood,
          }),
        }
      );

      setThoughts((current) => [
        newThought,
        ...current,
      ]);

      setText("");
      setMood("neutral");
      setShowCapture(false);

      setMessage("Thought captured.");

      // Cosmetic only — clears itself, never touches saved data.
      setJustCapturedId(newThought.id);
      setTimeout(() => setJustCapturedId(null), 2600);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save thought."
      );
    } finally {
      setCreating(false);
    }
  };

  /*
   * ---------------------------------------
   * LOGOUT
   * ---------------------------------------
   */

  const handleLogout = async () => {
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  };

  /*
   * ---------------------------------------
   * DATE / TIME / SKY
   * ---------------------------------------
   */

  const time = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const date = currentTime.toLocaleDateString(
    [],
    {
      weekday: "long",
      month: "long",
      day: "numeric",
    }
  );

  const sky = useMemo(() => skyStateFor(currentTime), [currentTime]);

  /*
   * ---------------------------------------
   * JOURNEY MESSAGE
   * ---------------------------------------
   */

  const journeyMessage = useMemo(() => {
    if (thoughts.length === 0) {
      return "No active quest yet — your first thought could become one";
    }

    if (thoughts.length === 1) {
      return "Your journey has begun";
    }

    return `${thoughts.length} moments captured along your journey`;
  }, [thoughts.length]);

  /*
   * ---------------------------------------
   * CARRIAGES — derived purely from thoughts
   * already in memory, grouped by day.
   * ---------------------------------------
   */

  const carriages = useMemo(() => {
    const todayKeyVal = dayKey(currentTime.toISOString());
    const groups = new Map<string, number>();

    thoughts.forEach((t) => {
      const k = dayKey(t.captured_at);
      if (k === todayKeyVal) return;
      groups.set(k, (groups.get(k) ?? 0) + 1);
    });

    return Array.from(groups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 2)
      .reverse()
      .map(([key, count]) => ({
        key,
        count,
        label: relativeDayLabel(key, todayKeyVal),
      }));
  }, [thoughts, currentTime]);

  return (
    <main className={styles.page}>

      {/* -------------------------------- */}
      {/* SIDE NAVIGATION */}
      {/* -------------------------------- */}

      <aside className={styles.sidebar}>

        <div className={styles.sidebarTop}>

          <button
            className={`${styles.navButton} ${styles.navActive}`}
            aria-label="Journey"
            title="Journey"
          >
            <CompassIcon />
          </button>

        </div>

        <div className={styles.sidebarBottom}>

          <button
            className={styles.navButton}
            aria-label="Saved thoughts"
            title="Saved"
          >
            <HeartIcon />
          </button>

          <button
            className={styles.navButton}
            aria-label="History"
            title="History"
          >
            <ClockIcon />
          </button>

          <button
            className={styles.navButton}
            aria-label="More"
            title="More"
          >
            <DotsIcon />
          </button>

        </div>

      </aside>


      {/* -------------------------------- */}
      {/* MAIN SCENE */}
      {/* -------------------------------- */}

      <div className={styles.scene}>

        {/* SKY */}

        <div
          className={styles.sky}
          style={{
            background: `linear-gradient(180deg, ${sky.skyTop} 0%, ${sky.skyBottom} 70%, #b79a84 100%)`,
          }}
        />

        <div className={styles.stars} style={{ opacity: sky.starOpacity }}>
          {Array.from({ length: 75 }).map(
            (_, index) => (
              <span
                key={index}
                style={{
                  left: `${(index * 37) % 100}%`,
                  top: `${(index * 53) % 68}%`,
                  opacity:
                    0.18 +
                    ((index * 17) % 70) / 100,
                  transform: `scale(${
                    0.4 +
                    ((index * 13) % 10) / 10
                  })`,
                }}
              />
            )
          )}
        </div>


        {/* MOON / SUN GLOW */}

        <div
          className={styles.moon}
          style={{ opacity: sky.celestialOpacity }}
        >
          <div className={styles.moonCore} />
        </div>


        {/* HEADER */}

        <header className={styles.header}>

          <div className={styles.brand}>
            life<span>journey</span>
          </div>

          <div className={styles.timeBlock}>

            <div className={styles.time}>
              {time}
            </div>

            <div className={styles.date}>
              {date}
            </div>

            <div className={styles.moodLine}>
              {sky.quip}
            </div>

          </div>

        </header>


        {/* THOUGHTS */}

        <section className={styles.thoughtLayer}>

          {loading && (
            <div className={styles.loading}>
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
              Preparing your journey...
            </div>
          )}

          {!loading &&
            thoughts.map((thought, index) => {

              const positions = [
                styles.positionOne,
                styles.positionTwo,
                styles.positionThree,
                styles.positionFour,
                styles.positionFive,
              ];

              const hasAttachment = Boolean(thought.attachment_url);

              return (
                <button
                  key={thought.id}
                  type="button"
                  className={`${styles.thought} ${
                    positions[
                      index % positions.length
                    ]
                  } ${
                    thought.id === justCapturedId
                      ? styles.thoughtNew
                      : ""
                  }`}
                  style={{ "--i": index } as React.CSSProperties}
                  onClick={() =>
                    setSelectedThought(thought)
                  }
                >

                  <div className={styles.thoughtOrb}>
                    {moodSymbols[
                      thought.mood ?? "neutral"
                    ] ?? "○"}
                  </div>

                  <div className={styles.thoughtContent}>
                    {thought.text}
                  </div>

                  <div className={styles.thoughtFooter}>
                    <span className={styles.thoughtMood}>
                      {thought.mood ?? "neutral"}
                    </span>

                    {hasAttachment && (
                      <span className={styles.thoughtAttachIcon}>
                        {thought.attachment_type === "audio" ? (
                          <MicIcon size={11} />
                        ) : (
                          <ImageIcon size={11} />
                        )}
                      </span>
                    )}
                  </div>

                </button>
              );
            })}

        </section>


        {/* EMPTY STATE */}

        {!loading &&
          thoughts.length === 0 && (
            <div className={styles.emptyState}>

              <div className={styles.emptyDot}>
                <PlusIcon size={11} />
              </div>

              <span>
                Your first thought is waiting
              </span>

            </div>
          )}


        {/* LANDSCAPE */}

        <div className={styles.landscape}>

          <div className={styles.hillBack} />

          <div className={styles.hillMiddle} />

          <div className={styles.hillFront} />

          {/* railway */}

          <div className={styles.track}>

            <div className={styles.railOne} />
            <div className={styles.railTwo} />

            <div className={styles.sleepers}>
              {Array.from({ length: 35 }).map(
                (_, index) => (
                  <span key={index} />
                )
              )}
            </div>

          </div>


          {/* TRAIN */}

          <div className={styles.train}>
            {carriages.map((c) => (
              <Carriage key={c.key} litCount={c.count} label={c.label} />
            ))}
            <Engine isNight={sky.isNight} />
          </div>

        </div>


        {/* BOTTOM JOURNEY BAR */}

        <div className={styles.bottomBar}>

          <div className={styles.quest}>

            <span className={styles.questDot} />

            {journeyMessage}

          </div>


          <button
            type="button"
            className={styles.captureButton}
            onClick={() => {
              setMessage("");
              setError("");
              setShowCapture(true);
            }}
          >

            <PlusIcon />

            Capture a thought

          </button>


          <button
            type="button"
            className={styles.logout}
            onClick={handleLogout}
          >
            Leave journey
          </button>

        </div>


        {/* STATUS */}

        {(message || error) && (
          <div
            className={
              error
                ? styles.error
                : styles.success
            }
          >
            {error || message}
          </div>
        )}

      </div>


      {/* -------------------------------- */}
      {/* CAPTURE MODAL */}
      {/* -------------------------------- */}

      {showCapture && (
        <div
          className={styles.modalBackdrop}
          onMouseDown={() =>
            !creating &&
            setShowCapture(false)
          }
        >

          <div
            className={styles.modal}
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className={styles.close}
              onClick={() =>
                !creating &&
                setShowCapture(false)
              }
              aria-label="Close"
            >
              ×
            </button>

            <div className={styles.modalEyebrow}>
              A MOMENT ON YOUR JOURNEY
            </div>

            <h2>
              What&apos;s on your mind?
            </h2>

            <p>
              Capture it exactly as it is.
            </p>

            <form onSubmit={createThought}>

              <textarea
                value={text}
                onChange={(e) =>
                  setText(e.target.value)
                }
                placeholder="Let the thought wander..."
                maxLength={2000}
                autoFocus
                disabled={creating}
              />

              <div className={styles.moodTitle}>
                How does it feel?
              </div>

              <div className={styles.moods}>

                {moods.map((item) => (

                  <button
                    type="button"
                    key={item}
                    className={
                      mood === item
                        ? styles.moodActive
                        : styles.mood
                    }
                    onClick={() =>
                      setMood(item)
                    }
                  >

                    <span>
                      {moodSymbols[item]}
                    </span>

                    {item}

                  </button>

                ))}

              </div>

              <button
                type="submit"
                className={styles.modalSubmit}
                disabled={
                  creating ||
                  !text.trim()
                }
              >
                {creating ? (
                  <span className={styles.submitSpinner} />
                ) : (
                  "Add to my journey"
                )}
              </button>

            </form>

          </div>

        </div>
      )}


      {/* -------------------------------- */}
      {/* THOUGHT DETAIL */}
      {/* -------------------------------- */}

      {selectedThought && (
        <div
          className={styles.modalBackdrop}
          onMouseDown={() =>
            setSelectedThought(null)
          }
        >

          <div
            className={styles.detailModal}
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className={styles.close}
              onClick={() =>
                setSelectedThought(null)
              }
              aria-label="Close"
            >
              ×
            </button>

            <div className={styles.detailOrb}>
              {moodSymbols[
                selectedThought.mood ??
                  "neutral"
              ] ?? "○"}
            </div>

            <div className={styles.detailMood}>
              {selectedThought.mood ??
                "neutral"}
            </div>

            {selectedThought.attachment_url && selectedThought.attachment_type === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={styles.detailImage}
                src={selectedThought.attachment_url}
                alt=""
              />
            )}

            {selectedThought.attachment_url && selectedThought.attachment_type === "audio" && (
              <audio
                className={styles.detailAudio}
                controls
                src={selectedThought.attachment_url}
              />
            )}

            <div className={styles.detailText}>
              {selectedThought.text}
            </div>

            <div className={styles.detailDate}>
              {new Date(
                selectedThought.captured_at
              ).toLocaleString()}
            </div>

          </div>

        </div>
      )}

    </main>
  );
}
