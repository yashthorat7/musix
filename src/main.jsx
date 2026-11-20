import React from "react";
import ReactDOM from "react-dom/client";
import { AudioProvider } from "./context/AudioContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AudioProvider>
      <App />
    </AudioProvider>
  </React.StrictMode>,
);
