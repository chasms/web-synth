import "./App.css";

import React from "react";

import { AudioContextControls } from "./components/AudioContextControls";
import { PatchWorkspace } from "./components/patch/PatchWorkspace";
import { Synthesizer } from "./components/Synthesizer";
import { AudioContextProvider } from "./hooks/AudioContextProvider";
import { PatchProvider } from "./modular/graph/PatchProvider";

function App() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  return (
    <AudioContextProvider>
      <div className="app-layout">
        <div className="top-bar">
          <div className="title">Web Audio Modular Synth</div>
          <div className="actions">
            <AudioContextControls />
            <button
              className="drawer-toggle"
              onClick={() => setDrawerOpen((o) => !o)}
              aria-expanded={drawerOpen}
              aria-controls="legacy-drawer"
            >
              {drawerOpen ? "Hide Legacy" : "Show Legacy"}
            </button>
          </div>
        </div>
        <div className="main-region">
          <PatchProvider>
            <PatchWorkspace />
          </PatchProvider>
          <aside
            id="legacy-drawer"
            className={`legacy-drawer ${drawerOpen ? "open" : ""}`}
            aria-hidden={!drawerOpen}
          >
            <h2>Legacy Synth</h2>
            <Synthesizer />
          </aside>
        </div>
      </div>
    </AudioContextProvider>
  );
}

export default App;
