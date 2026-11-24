import { useEffect, useRef, useState, useCallback } from "react";

const gradientVariants = [
  {
    topLeft: "#8400ff",
    topRight: "#0055ff",
    bottomLeft: "#ff007f",
    bottomRight: "#ff39e5",
  },
  {
    topLeft: "#00ff88",
    topRight: "#00b7ff",
    bottomLeft: "#ff7b00",
    bottomRight: "#ff00d4",
  },
  {
    topLeft: "#ff0080",
    topRight: "#7700ff",
    bottomLeft: "#00ffd5",
    bottomRight: "#ff6f00",
  },
  {
    topLeft: "#7400ff",
    topRight: "#ff0000",
    bottomLeft: "#00ff95",
    bottomRight: "#4c00ff",
  },
  {
    topLeft: "#00f5a0",
    topRight: "#00d2ff",
    bottomLeft: "#ff007f",
    bottomRight: "#ffaa00",
  },
  {
    topLeft: "#ff0055",
    topRight: "#4361ee",
    bottomLeft: "#00f0ff",
    bottomRight: "#f72585",
  },
  {
    topLeft: "#ff5858",
    topRight: "#f857a6",
    bottomLeft: "#7f00ff",
    bottomRight: "#e100ff",
  },
  {
    topLeft: "#00f2fe",
    topRight: "#4facfe",
    bottomLeft: "#43e97b",
    bottomRight: "#38f9d7",
  },
  {
    topLeft: "#fa709a",
    topRight: "#fee140",
    bottomLeft: "#ff0844",
    bottomRight: "#ffb199",
  },
  {
    topLeft: "#00c6ff",
    topRight: "#0072ff",
    bottomLeft: "#10b981",
    bottomRight: "#6366f1",
  },
  {
    topLeft: "#8a2387",
    topRight: "#e94057",
    bottomLeft: "#f27121",
    bottomRight: "#ff0055",
  },
  {
    topLeft: "#b388ff",
    topRight: "#80d8ff",
    bottomLeft: "#ff80ab",
    bottomRight: "#ffd180",
  },
];

const SECONDS_PER_REV = 20;
const ROT_SPEED = 360 / SECONDS_PER_REV;

let globalDiscAngle = 0;
let globalTargetAngle = 0;
let globalTrackKey = "";

export function useDiscRotation(
  currentTime,
  isPlaying,
  isSeeking,
  coverArt,
  discRef,
  trackId = "",
  seekTrigger = null,
) {
  const gradientRef = useRef(
    gradientVariants[Math.floor(Math.random() * gradientVariants.length)],
  );

  const angleRef = useRef(globalDiscAngle);
  const targetAngleRef = useRef(globalTargetAngle);
  const prevTrackRef = useRef(trackId || coverArt || globalTrackKey || "");
  const lastFrameTimeRef = useRef(performance.now());
  const isPlayingRef = useRef(isPlaying);
  const isSeekingRef = useRef(isSeeking);
  const lastSeekTimestampRef = useRef(0);
  const seekAnimRef = useRef(null);
  const animIdRef = useRef(null);

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine !== false : true,
  );
  const [isCoverValid, setIsCoverValid] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!coverArt) {
      setIsCoverValid(false);
      return;
    }

    if (coverArt.startsWith("data:") || coverArt.startsWith("blob:")) {
      setIsCoverValid(true);
      return;
    }

    if (!isOnline) {
      setIsCoverValid(false);
      return;
    }

    let active = true;
    const img = new Image();
    img.onload = () => {
      if (active) setIsCoverValid(true);
    };
    img.onerror = () => {
      if (active) setIsCoverValid(false);
    };
    img.src = coverArt;

    return () => {
      active = false;
    };
  }, [coverArt, isOnline]);

  const randomizeGradient = () => {
    gradientRef.current =
      gradientVariants[Math.floor(Math.random() * gradientVariants.length)];
  };

  useEffect(() => {
    randomizeGradient();
  }, [coverArt]);

  useEffect(() => {
    const currentKey = trackId || coverArt || "";
    if (!currentKey) return;

    if (prevTrackRef.current && prevTrackRef.current !== currentKey) {
      seekAnimRef.current = null;
      targetAngleRef.current = angleRef.current;
      globalTargetAngle = angleRef.current;
      globalDiscAngle = angleRef.current;
    }
    prevTrackRef.current = currentKey;
    globalTrackKey = currentKey;
  }, [trackId, coverArt]);

  const startAnimation = useCallback(() => {
    if (animIdRef.current) return;
    lastFrameTimeRef.current = performance.now();

    const tick = (now) => {
      const dt = Math.min((now - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = now;

      const activePlaying = isPlayingRef.current;
      const seeking = isSeekingRef.current;

      if (seeking) {
        // While user is scrubbing, disc stays at current scrub angle
        if (discRef?.current) {
          discRef.current.style.transform = `rotate(${angleRef.current}deg)`;
        }
      } else if (seekAnimRef.current) {
        const anim = seekAnimRef.current;
        const elapsed = now - anim.startTime;
        const p = Math.min(1, Math.max(0, elapsed / anim.duration));
        // Smooth cubic ease-out: starts fast, finishes smoothly in exactly duration (350ms)
        const ease = 1 - Math.pow(1 - p, 3);

        let newAngle = anim.startAngle + anim.totalDelta * ease;
        if (activePlaying) {
          // Accumulate normal playback rotation alongside seek spin
          newAngle += ROT_SPEED * (elapsed / 1000);
        }

        angleRef.current = newAngle;
        targetAngleRef.current = newAngle;

        if (p >= 1) {
          seekAnimRef.current = null;
        }
      } else if (activePlaying) {
        angleRef.current += ROT_SPEED * dt;
        targetAngleRef.current = angleRef.current;
      }

      globalDiscAngle = angleRef.current;
      globalTargetAngle = targetAngleRef.current;

      if (discRef?.current) {
        discRef.current.style.transform = `rotate(${angleRef.current}deg)`;
      }

      const hasActiveSeek = seekAnimRef.current !== null;
      if (activePlaying || hasActiveSeek) {
        animIdRef.current = requestAnimationFrame(tick);
      } else {
        animIdRef.current = null;
      }
    };

    animIdRef.current = requestAnimationFrame(tick);
  }, [discRef]);

  useEffect(() => {
    isSeekingRef.current = isSeeking;
    if (!isSeeking && isPlayingRef.current) {
      startAnimation();
    }
  }, [isSeeking, startAnimation]);

  useEffect(() => {
    if (
      !seekTrigger ||
      seekTrigger.timestamp === lastSeekTimestampRef.current
    ) {
      return;
    }
    lastSeekTimestampRef.current = seekTrigger.timestamp;

    const delta = seekTrigger.delta;
    if (!Number.isFinite(delta) || Math.abs(delta) < 0.05) return;

    const dir = Math.sign(delta);
    const absDelta = Math.abs(delta);

    // Calculate smooth, proportional, non-aliasing seek rotation:
    // Small delta (<= 8s): 18 deg/s (e.g. 5s = 90 deg)
    // Large delta (> 8s): scales smoothly up to at most 600 deg (1.66 turns)
    // At 600 deg over 350ms, peak velocity is ~28 deg/frame, perfectly below
    // optical aliasing thresholds so the vinyl record is visibly spinning!
    let spinAngle;
    if (absDelta <= 8) {
      spinAngle = absDelta * ROT_SPEED;
    } else {
      spinAngle = 144 + Math.min(456, (absDelta - 8) * 4.5);
    }
    const seekDeltaAngle = dir * spinAngle;

    // Fixed 350ms duration ensures catchup finishes cleanly under 400ms
    seekAnimRef.current = {
      startTime: performance.now(),
      duration: 350,
      startAngle: angleRef.current,
      totalDelta: seekDeltaAngle,
    };

    targetAngleRef.current = angleRef.current + seekDeltaAngle;
    globalTargetAngle = targetAngleRef.current;

    startAnimation();
  }, [seekTrigger, startAnimation]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;

    if (isPlaying) {
      startAnimation();
    } else {
      if (!seekAnimRef.current) {
        if (animIdRef.current) {
          cancelAnimationFrame(animIdRef.current);
          animIdRef.current = null;
        }
        if (discRef?.current) {
          discRef.current.style.transform = `rotate(${angleRef.current}deg)`;
        }
      }
    }

    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
    };
  }, [isPlaying, startAnimation, discRef]);

  const getDiscStyle = (customCover) => {
    const activeCover = customCover || coverArt;
    const isLocal =
      activeCover &&
      (activeCover.startsWith("data:") || activeCover.startsWith("blob:"));
    const canDisplay = Boolean(
      activeCover && (isLocal || (isOnline && isCoverValid)),
    );

    const gradientBackground = `radial-gradient(circle at top left, ${gradientRef.current.topLeft}, transparent 70%),
                radial-gradient(circle at top right, ${gradientRef.current.topRight}, transparent 70%),
                radial-gradient(circle at bottom left, ${gradientRef.current.bottomLeft}, transparent 70%),
                radial-gradient(circle at bottom right, ${gradientRef.current.bottomRight}, transparent 70%)`;

    return {
      backgroundImage: canDisplay
        ? `url("${activeCover}"), ${gradientBackground}`
        : gradientBackground,
      backgroundSize: "cover",
      backgroundPosition: "center",
      transform: `rotate(${angleRef.current}deg)`,
      willChange: "transform",
    };
  };

  return { rotation: angleRef.current, getDiscStyle, randomizeGradient };
}
