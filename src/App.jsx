import Player from './components/Player/Player';
import { AudioProvider } from './context/AudioContext';
import Splash from './components/Splash/Splash';
import Sidebar from './components/Sidebar/Sidebar';
import './App.css';
import { useSidebar } from './hooks/useSidebar';

function App() {
    const { isSidebarOpen, containerRef } = useSidebar();

    return (
        <AudioProvider>
            <main className="container" ref={containerRef}>
                <Splash>
                    <Player />
                    <Sidebar isOpen={isSidebarOpen} />
                </Splash>
            </main>
        </AudioProvider>
    );
}

export default App;
