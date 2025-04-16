import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Import init function from "@neutralinojs/lib"
import { init, events, window as neuWindow } from "@neutralinojs/lib"

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

init(); // Add this function call



events.on("ready", async () => {
  const screenWidth = window.screen.availWidth;
  const screenHeight = window.screen.availHeight;

  const windowSize = await neuWindow.getSize();
  const windowWidth = windowSize.width;
  const windowHeight = windowSize.height;

  const x = screenWidth - windowWidth - 16;
  const y = screenHeight - windowHeight - 16;

  await neuWindow.move(x, y);
});
