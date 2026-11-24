import Player from "./components/Player/Player";
import Splash from "./components/Splash/Splash";
import Sidebar from "./components/Sidebar/Sidebar";
import Directory from "./components/Directory/Directory";
import Equalizer from "./components/Equalizer/Equalizer";
import Miniview from "./components/Miniview/Miniview";
import "./App.css";
import { useState, useRef } from "react";
import { useAudio } from "./context/AudioContext";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
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
  } = useAudio();
  const [viewMode, setViewMode] = useState("full");
  const isTransitioning = useRef(false);

  const handleRemoveSong = (index) => {
    removeSong(index);
  };

  const handleShowMiniview = async () => {
    if (isTransitioning.current || viewMode !== "full") return;
    isTransitioning.current = true;
    setActivePanel(null);
    setViewMode("minimizing");

    await new Promise((resolve) => setTimeout(resolve, 230));

    try {
      await invoke("resize_window_keep_anchor", {
        targetWidth: 96.0,
        targetHeight: 96.0,
      });
    } catch (e) {
      try {
        const win = getCurrentWindow();
        await win.setSize(new LogicalSize(96, 96));
        await invoke("reposition_window");
      } catch (err) {}
    } finally {
      setViewMode("miniview");
      isTransitioning.current = false;
    }
  };

  const handleRestoreMain = async () => {
    if (isTransitioning.current || viewMode !== "miniview") return;
    isTransitioning.current = true;

    try {
      await invoke("resize_window_keep_anchor", {
        targetWidth: 256.0,
        targetHeight: 256.0,
      });
    } catch (e) {
      try {
        const win = getCurrentWindow();
        await win.setSize(new LogicalSize(256, 256));
        await invoke("reposition_window");
      } catch (err) {}
    }

    setViewMode("maximizing");

    await new Promise((resolve) => setTimeout(resolve, 230));

    setViewMode("full");
    isTransitioning.current = false;
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
          <div className={cardClasses}>
            <Player onMinimize={handleShowMiniview} viewMode={viewMode} />
            <Directory
              isOpen={activePanel === "directory"}
              songs={queue}
              currentIndex={currentIndex}
              onRemove={handleRemoveSong}
              onClear={clearQueue}
              onShuffle={shuffleQueue}
              onSelectSong={playSongAtIndex}
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
