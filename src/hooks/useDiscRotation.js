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

      const diff = targetAngleRef.current - angleRef.current;
      const absDiff = Math.abs(diff);

      if (seeking) {
        angleRef.current = targetAngleRef.current;
      } else if (absDiff > 0.05) {
        const catchUpSpeed = Math.max(absDiff / 0.4, 240);
        const step = Math.sign(diff) * catchUpSpeed * dt;
        if (Math.abs(step) >= absDiff) {
          angleRef.current = targetAngleRef.current;
        } else {
          angleRef.current += step;
        }
      } else {
        angleRef.current = targetAngleRef.current;
        if (activePlaying) {
          angleRef.current += ROT_SPEED * dt;
          targetAngleRef.current = angleRef.current;
        }
      }

      globalDiscAngle = angleRef.current;
      globalTargetAngle = targetAngleRef.current;

      if (discRef?.current) {
        discRef.current.style.transform = `rotate(${angleRef.current}deg)`;
      }

      const remainingDiff = Math.abs(targetAngleRef.current - angleRef.current);
      if (activePlaying || remainingDiff > 0.05) {
        animIdRef.current = requestAnimationFrame(tick);
      } else {
        animIdRef.current = null;
      }
    };

    animIdRef.current = requestAnimationFrame(tick);
  }, [discRef]);

  useEffect(() => {
    isSeekingRef.current = isSeeking;
    if (!isSeeking) {
      targetAngleRef.current = angleRef.current;
      globalTargetAngle = angleRef.current;
      globalDiscAngle = angleRef.current;
      if (isPlayingRef.current) {
        startAnimation();
      }
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
    if (!Number.isFinite(delta)) return;

    const deltaAngle = delta * ROT_SPEED;
    targetAngleRef.current += deltaAngle;
    globalTargetAngle = targetAngleRef.current;

    if (isSeekingRef.current) {
      angleRef.current = targetAngleRef.current;
      globalDiscAngle = angleRef.current;
      if (discRef?.current) {
        discRef.current.style.transform = `rotate(${angleRef.current}deg)`;
      }
    } else {
      startAnimation();
    }
  }, [seekTrigger, startAnimation, discRef]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;

    if (isPlaying) {
      targetAngleRef.current = angleRef.current;
      globalTargetAngle = angleRef.current;
      globalDiscAngle = angleRef.current;
      startAnimation();
    } else {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
      targetAngleRef.current = angleRef.current;
      globalTargetAngle = angleRef.current;
      globalDiscAngle = angleRef.current;
      if (discRef?.current) {
        discRef.current.style.transform = `rotate(${angleRef.current}deg)`;
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
