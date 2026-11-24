import React, { useRef, useEffect, useState, useCallback } from "react";
import styles from "./Directory.module.css";
import { invoke } from "@tauri-apps/api/core";
import { useAudio } from "../../context/AudioContext";

function Directory({
  isOpen,
  songs = [],
  currentIndex = -1,
  onRemove,
  onClear,
  onShuffle,
  onSelectSong,
  onReorder,
}) {
  const currentSongRef = useRef(null);
  const songListRef = useRef(null);
  const itemRefs = useRef([]);
  const { processSongs, isPlaying, reorderSongs } = useAudio();

  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [draggedIndex, setDraggedIndex] = useState(-1);
  const [dropSlot, setDropSlot] = useState(-1);

  const songsRef = useRef(songs);
  songsRef.current = songs;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;
  const reorderSongsRef = useRef(reorderSongs);
  reorderSongsRef.current = reorderSongs;

  const dragStateRef = useRef({
    startIndex: -1,
    startX: 0,
    startY: 0,
    isDragging: false,
  });
  const dropSlotRef = useRef(-1);
  const lastPointerYRef = useRef(null);
  const scrollAnimRef = useRef(null);
  const scrollSpeedRef = useRef(0);
  const justFinishedDraggingRef = useRef(false);
  const dragListenersRef = useRef(null);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, songs.length);
  }, [songs]);

  const stopAutoScroll = useCallback(() => {
    if (scrollAnimRef.current) {
      cancelAnimationFrame(scrollAnimRef.current);
      scrollAnimRef.current = null;
    }
    scrollSpeedRef.current = 0;
  }, []);

  const calculateDropSlot = useCallback((clientY) => {
    const currentSongs = songsRef.current;
    if (!songListRef.current || currentSongs.length === 0) return -1;
    const items = itemRefs.current
      .slice(0, currentSongs.length)
      .filter(Boolean);
    if (items.length === 0) return -1;

    const firstRect = items[0].getBoundingClientRect();
    if (clientY < firstRect.top + firstRect.height / 2) {
      return 0;
    }

    const lastRect = items[items.length - 1].getBoundingClientRect();
    if (clientY > lastRect.bottom - lastRect.height / 2) {
      return items.length;
    }

    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (clientY >= rect.top && clientY <= rect.bottom) {
        return clientY < midY ? i : i + 1;
      }
      if (i < items.length - 1) {
        const nextRect = items[i + 1].getBoundingClientRect();
        if (clientY > rect.bottom && clientY < nextRect.top) {
          return i + 1;
        }
      }
    }

    return -1;
  }, []);

  const startAutoScroll = useCallback(() => {
    if (scrollAnimRef.current) return;
    const scrollStep = () => {
      if (scrollSpeedRef.current !== 0 && songListRef.current) {
        songListRef.current.scrollTop += scrollSpeedRef.current;
        if (lastPointerYRef.current !== null) {
          const slot = calculateDropSlot(lastPointerYRef.current);
          dropSlotRef.current = slot;
          setDropSlot(slot);
        }
      }
      scrollAnimRef.current = requestAnimationFrame(scrollStep);
    };
    scrollAnimRef.current = requestAnimationFrame(scrollStep);
  }, [calculateDropSlot]);

  const removeWindowListeners = useCallback(() => {
    if (dragListenersRef.current) {
      window.removeEventListener(
        "pointermove",
        dragListenersRef.current.onMove,
      );
      window.removeEventListener("pointerup", dragListenersRef.current.onUp);
      window.removeEventListener(
        "pointercancel",
        dragListenersRef.current.onCancel,
      );
      dragListenersRef.current = null;
    }
  }, []);

  const cleanupDrag = useCallback(() => {
    stopAutoScroll();
    removeWindowListeners();
    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    setDraggedIndex(-1);
    setDropSlot(-1);
    dragStateRef.current = {
      startIndex: -1,
      startX: 0,
      startY: 0,
      isDragging: false,
    };
    dropSlotRef.current = -1;
    lastPointerYRef.current = null;
  }, [stopAutoScroll, removeWindowListeners]);

  const handlePointerDown = (e, index) => {
    if (e.button !== 0) return;
    if (e.target.closest("button")) return;

    e.stopPropagation();

    dragStateRef.current = {
      startIndex: index,
      startX: e.clientX,
      startY: e.clientY,
      isDragging: false,
    };
    dropSlotRef.current = -1;
    lastPointerYRef.current = e.clientY;

    const onMove = (moveEvt) => {
      lastPointerYRef.current = moveEvt.clientY;
      const { startIndex, startX, startY, isDragging } = dragStateRef.current;

      if (!isDragging) {
        const dist = Math.hypot(
          moveEvt.clientX - startX,
          moveEvt.clientY - startY,
        );
        if (dist > 4) {
          dragStateRef.current.isDragging = true;
          setDraggedIndex(startIndex);
          document.body.style.cursor = "grabbing";
          document.body.style.userSelect = "none";
        } else {
          return;
        }
      }

      const slot = calculateDropSlot(moveEvt.clientY);
      dropSlotRef.current = slot;
      setDropSlot(slot);

      if (songListRef.current) {
        const listRect = songListRef.current.getBoundingClientRect();
        const edgeZone = 28;
        if (moveEvt.clientY < listRect.top + edgeZone) {
          const intensity = Math.max(
            1,
            (listRect.top + edgeZone - moveEvt.clientY) / edgeZone,
          );
          scrollSpeedRef.current = -Math.round(intensity * 7);
          startAutoScroll();
        } else if (moveEvt.clientY > listRect.bottom - edgeZone) {
          const intensity = Math.max(
            1,
            (moveEvt.clientY - (listRect.bottom - edgeZone)) / edgeZone,
          );
          scrollSpeedRef.current = Math.round(intensity * 7);
          startAutoScroll();
        } else {
          scrollSpeedRef.current = 0;
        }
      }
    };

    const onUp = () => {
      const { startIndex, isDragging } = dragStateRef.current;
      const targetSlot = dropSlotRef.current;
      const currentSongs = songsRef.current;

      cleanupDrag();

      if (isDragging) {
        justFinishedDraggingRef.current = true;
        setTimeout(() => {
          justFinishedDraggingRef.current = false;
        }, 120);

        if (
          targetSlot !== -1 &&
          targetSlot !== startIndex &&
          targetSlot !== startIndex + 1
        ) {
          const finalIndex =
            targetSlot > startIndex ? targetSlot - 1 : targetSlot;

          if (
            finalIndex >= 0 &&
            finalIndex < currentSongs.length &&
            finalIndex !== startIndex
          ) {
            if (onReorderRef.current) {
              onReorderRef.current(startIndex, finalIndex);
            } else if (reorderSongsRef.current) {
              reorderSongsRef.current(startIndex, finalIndex);
            }
          }
        }
      }
    };

    const onCancel = () => {
      cleanupDrag();
    };

    removeWindowListeners();
    dragListenersRef.current = { onMove, onUp, onCancel };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  };

  useEffect(() => {
    if (!isOpen) {
      setHoveredIndex(-1);
      cleanupDrag();
    }
  }, [isOpen, cleanupDrag]);

  useEffect(() => {
    return () => {
      cleanupDrag();
    };
  }, [cleanupDrag]);

  useEffect(() => {
    if (isOpen && currentSongRef.current && draggedIndex === -1) {
      currentSongRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [isOpen, currentIndex, draggedIndex]);

  const handleAddClick = async () => {
    try {
      const selected = await invoke("select_audio_files");
      if (Array.isArray(selected) && selected.length > 0) {
        await processSongs(selected, false);
      }
    } catch (error) {}
  };

  const isSlotActive =
    draggedIndex >= 0 &&
    dropSlot >= 0 &&
    dropSlot !== draggedIndex &&
    dropSlot !== draggedIndex + 1;

  return (
    <div
      className={`${styles.container} ${isOpen ? styles.open : ""}`}
      data-no-window-drag
    >
      <div className={styles.songList} ref={songListRef} data-no-window-drag>
        {songs.length === 0 ? (
          <div className={styles.emptyMessage}>No songs in queue</div>
        ) : (
          songs.map((song, index) => {
            const isCurrent = index === currentIndex;
            const isHovered = hoveredIndex === index && draggedIndex === -1;
            const shouldMarquee =
              (isCurrent ? isPlaying : isHovered) && draggedIndex === -1;
            const displayName =
              song.metadata?.title ||
              song.fileName ||
              (song.path ? song.path.split(/[/\\]/).pop() : "Unknown Song");

            const showTopIndicator = isSlotActive && dropSlot === index;
            const showBottomIndicator =
              isSlotActive &&
              dropSlot === songs.length &&
              index === songs.length - 1;

            return (
              <div
                key={`${song.path || index}-${index}`}
                ref={(el) => {
                  itemRefs.current[index] = el;
                  if (isCurrent) currentSongRef.current = el;
                }}
                className={`${styles.songItem} ${isCurrent ? styles.currentSong : ""} ${draggedIndex === index ? styles.dragging : ""}`}
                onPointerDown={(e) => handlePointerDown(e, index)}
                onClick={() => {
                  if (
                    justFinishedDraggingRef.current ||
                    dragStateRef.current.isDragging
                  )
                    return;
                  onSelectSong && onSelectSong(index);
                }}
                onMouseEnter={() => {
                  if (draggedIndex === -1) setHoveredIndex(index);
                }}
                onMouseLeave={() => {
                  if (draggedIndex === -1) setHoveredIndex(-1);
                }}
                data-no-window-drag
              >
                {showTopIndicator && (
                  <div className={styles.dropIndicatorTop} />
                )}
                <div className={styles.songTitle} data-no-window-drag>
                  {shouldMarquee ? (
                    <div
                      className={styles.marqueeTrack}
                      style={{
                        animationDuration: `${Math.max(4, Math.round(displayName.length * 0.35))}s`,
                      }}
                    >
                      <span className={styles.marqueeText}>{displayName}</span>
                      <span className={styles.marqueeText}>{displayName}</span>
                    </div>
                  ) : (
                    <div className={styles.staticTitle}>{displayName}</div>
                  )}
                </div>
                <button
                  className={styles.removeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRemove) onRemove(index);
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  type="button"
                  data-no-window-drag
                >
                  <img
                    src="/icons/minus.svg"
                    alt=""
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </button>
                {showBottomIndicator && (
                  <div className={styles.dropIndicatorBottom} />
                )}
              </div>
            );
          })
        )}
      </div>

      <div className={styles.controls} data-no-window-drag>
        <div className={styles.capsule} data-no-window-drag>
          <button
            className={styles.capsuleButton}
            onClick={onShuffle}
            type="button"
            data-no-window-drag
          >
            <img
              src="/icons/random.svg"
              alt=""
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </button>
          <button
            className={styles.capsuleButton}
            onClick={handleAddClick}
            type="button"
            data-no-window-drag
          >
            <img
              src="/icons/add.svg"
              alt=""
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Directory;
