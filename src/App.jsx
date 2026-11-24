import Player from "./components/Player/Player";
import Splash from "./components/Splash/Splash";
import Sidebar from "./components/Sidebar/Sidebar";
import Directory from "./components/Directory/Directory";
import Equalizer from "./components/Equalizer/Equalizer";
import Miniview from "./components/Miniview/Miniview";
import "./App.css";
import { useState, useRef, useEffect } from "react";
import { useAudio } from "./context/AudioContext";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [activePanel, setActivePanel] = useState(null);
  const {
    queue,
    currentIndex,
    removeSong,
    clearQueue,
    shuffleQueue,
    playSongAtIndex,
    reorderSongs,
  } = useAudio();
  const [viewMode, setViewMode] = useState("full");
  const isTransitioning = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (viewMode === "full") {
      invoke("resize_window_keep_anchor", {
        targetWidth: 256.0,
        targetHeight: 256.0,
      }).catch(() => {});
    }
  }, [viewMode]);

  const handleRemoveSong = (index) => {
    removeSong(index);
  };

  const handleShowMiniview = async () => {
    if (isTransitioning.current || viewMode !== "full") return;
    isTransitioning.current = true;
    setActivePanel(null);
    setViewMode("minimizing");

    await new Promise((resolve) => setTimeout(resolve, 220));

    setViewMode("miniview");

    try {
      await invoke("resize_window_keep_anchor", {
        targetWidth: 96.0,
        targetHeight: 96.0,
      });
    } catch (e) {
    } finally {
      isTransitioning.current = false;
    }
  };

  const handleRestoreMain = async () => {
    if (isTransitioning.current || viewMode !== "miniview") return;
    isTransitioning.current = true;

    try {
      try {
        await invoke("resize_window_keep_anchor", {
          targetWidth: 256.0,
          targetHeight: 256.0,
        });
      } catch (e) {}

      setViewMode("maximizing");

      await new Promise((resolve) => setTimeout(resolve, 220));

      setViewMode("full");

      try {
        await invoke("resize_window_keep_anchor", {
          targetWidth: 256.0,
          targetHeight: 256.0,
        });
      } catch (e) {}
    } finally {
      isTransitioning.current = false;
    }
  };

  const handleDragMouseDown = (e) => {
    if (viewMode === "miniview") return;
    if (
      e.button === 0 &&
      !e.target.closest(
        "button, input, [data-slider], a, [data-no-window-drag]",
      )
    ) {
      try {
        invoke("start_dragging");
      } catch (err) {
        try {
          getCurrentWindow().startDragging();
        } catch (e2) {}
      }
    }
  };

  const isMini = viewMode === "miniview";

  const cardClasses = [
    "card",
    viewMode === "minimizing" ? "minimizing" : "",
    viewMode === "maximizing" ? "maximizing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const sidebarClasses = [
    "sidebarWrapper",
    viewMode === "minimizing"
      ? "fadeOut"
      : viewMode === "maximizing"
        ? "fadeIn"
        : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main
      className={`appContainer ${isMini ? "miniviewContainer" : ""}`}
      onMouseDown={handleDragMouseDown}
    >
      <Splash>
        {isMini ? (
          <Miniview onRestore={handleRestoreMain} />
        ) : (
          <div
            className={cardClasses}
            onDoubleClick={(e) => {
              if (
                e.target.closest(
                  "button, input, [data-slider], a, [data-no-window-drag]",
                )
              )
                return;
              invoke("resize_window_keep_anchor", {
                targetWidth: 256.0,
                targetHeight: 256.0,
              }).catch(() => {});
            }}
          >
            <Player onMinimize={handleShowMiniview} viewMode={viewMode} />
            <Directory
              isOpen={activePanel === "directory"}
              songs={queue}
              currentIndex={currentIndex}
              onRemove={handleRemoveSong}
              onClear={clearQueue}
              onShuffle={shuffleQueue}
              onSelectSong={playSongAtIndex}
              onReorder={reorderSongs}
            />
            <Equalizer isOpen={activePanel === "equalizer"} />
            <div className={sidebarClasses}>
              <Sidebar
                activePanel={activePanel}
                onPanelChange={setActivePanel}
              />
            </div>
          </div>
        )}
      </Splash>
    </main>
  );
}

export default App;
