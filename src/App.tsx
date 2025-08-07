import "./App.css";

import { Synthesizer } from "./components/Synthesizer";
import { AudioContextProvider } from "./hooks/AudioContextProvider";

function App() {
  return (
    <AudioContextProvider>
      <div className="app">
        <header>
          <h1>Web Audio Minimoog Synthesizer</h1>
        </header>
        <main>
          <Synthesizer />
        </main>
      </div>
    </AudioContextProvider>
  );
}

export default App;
