import SplashScreen from './components/SplashScreen';
import './App.css';


function App() {
  const isLoading = true;

  return (
    isLoading ? <SplashScreen /> : null
  );
}

export default App;