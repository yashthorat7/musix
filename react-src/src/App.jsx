import { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import Player from './components/Player';
import './App.css';
import { window as neuWindow } from '@neutralinojs/lib';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    // const interval = setInterval(() => {
    //   window.location.reload();
    // }, 10000);

    const preventZoom = (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    window.addEventListener('wheel', preventZoom, { passive: false });
    window.addEventListener('keydown', preventZoom);

    neuWindow.setDraggableRegion("app", {
      alwaysCapture: true,
      dragMinDistance: 12,
    })

    return () => {
      clearTimeout(timeout);
      // clearInterval(interval);
      window.removeEventListener('wheel', preventZoom);
      window.removeEventListener('keydown', preventZoom);
    };
  }, []);


  return (
    <div id="app" className="app">
      {isLoading ? <SplashScreen /> : <Player />}
    </div>
  );
}

export default App;
