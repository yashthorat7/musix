import './App.css';
import Player from './components/Player/Player';
import { AudioProvider } from './context/AudioContext';
import Splash from './components/Splash/Splash';

function App() {
    return (
        <AudioProvider>
            <main className="container">
                <Splash>
                    <Player />
                </Splash>
            </main>
        </AudioProvider>
    );
}

export default App;
