import "./App.css";

import { AudioContextControls } from "./components/AudioContextControls";
import { PatchWorkspace } from "./components/patch/PatchWorkspace";
import { AudioContextProvider } from "./hooks/AudioContextProvider";
import { PatchProvider } from "./modular/graph/PatchProvider";

function App() {
  return (
    <AudioContextProvider>
      <div className="app-layout">
        <div className="top-bar">
          <div className="title">Web Audio Modular Synth</div>
          <div className="actions">
            <AudioContextControls />
          </div>
        </div>
        <div className="main-region">
          <PatchProvider>
            <PatchWorkspace />
          </PatchProvider>
        </div>
      </div>
    </AudioContextProvider>
  );
}

export default App;
