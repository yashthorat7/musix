import { useEffect } from "react";
import { moveWindow, Position } from "@tauri-apps/plugin-positioner";
moveWindow(Position.BottomRight);
import "./App.css";


function App() {

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>
    </main>
  );
}

export default App;
