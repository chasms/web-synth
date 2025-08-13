import "./App.css";

import { PatchWorkspace } from "./components/patch/PatchWorkspace";
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
          <div
            style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}
          >
            <div>
              <h2>Legacy Synthesizer</h2>
              <Synthesizer />
            </div>
            <div style={{ flex: 1 }}>
              <h2>Modular Patch (Experimental)</h2>
              <PatchWorkspace />
            </div>
          </div>
        </main>
      </div>
    </AudioContextProvider>
  );
}

export default App;
