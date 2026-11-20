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
  const { queue, removeSong, clearQueue, shuffleQueue, playSongAtIndex } =
    useAudio();
  const [viewMode, setViewMode] = useState("full");
  const isTransitioning = useRef(false);

  const handleRemoveSong = (index) => {
    removeSong(index);
  };

  const handleShowMiniview = async () => {
    if (isTransitioning.current || viewMode !== "full") return;
    isTransitioning.current = true;
    setViewMode("minimizing");

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
    setViewMode("maximizing");

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
    } finally {
      setViewMode("full");
      isTransitioning.current = false;
    }
  };

  const handleDragMouseDown = (e) => {
    if (
      e.button === 0 &&
      !e.target.closest("button, input, [data-slider], [data-no-drag], a")
    ) {
      try {
        getCurrentWindow().startDragging();
      } catch (err) {}
    }
  };

  const isMini = viewMode === "miniview";
  const containerClasses = ["container", isMini ? "miniviewContainer" : ""]
    .filter(Boolean)
    .join(" ");

  const wrapperClasses = [
    "viewWrapper",
    viewMode === "minimizing" ? "minimizing" : "",
    viewMode === "maximizing" ? "maximizing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main
      className={containerClasses}
      data-tauri-drag-region
      onMouseDown={handleDragMouseDown}
    >
      <Splash>
        {isMini ? (
          <Miniview onRestore={handleRestoreMain} />
        ) : (
          <>
            <div className={wrapperClasses}>
              <Player onMinimize={handleShowMiniview} />
              <Directory
                isOpen={activePanel === "directory"}
                songs={queue}
                onRemove={handleRemoveSong}
                onClear={clearQueue}
                onShuffle={shuffleQueue}
                onSelectSong={playSongAtIndex}
              />
              <Equalizer isOpen={activePanel === "equalizer"} />
              <Sidebar
                activePanel={activePanel}
                onPanelChange={setActivePanel}
              />
            </div>
            {viewMode === "minimizing" && (
              <div className="miniviewTransitionWrapper minimizing">
                <Miniview isPreview />
              </div>
            )}
            {viewMode === "maximizing" && (
              <div className="miniviewTransitionWrapper maximizing">
                <Miniview isPreview />
              </div>
            )}
          </>
        )}
      </Splash>
    </main>
  );
}

export default App;
