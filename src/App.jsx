import { useState, useEffect } from "react";
import { moveWindow, Position } from "@tauri-apps/plugin-positioner";
moveWindow(Position.BottomRight);
import "./App.css";
import Splash from "./components/Splash";
import Player from "./components/Player";

function App() {

  const [isSplash, setIsSplash] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsSplash(false);
    }, 3000);
  }, []);
  
  return (
    <main className="container">
      {isSplash ? <Splash /> : <Player />}
    </main>
  );
}

export default App;