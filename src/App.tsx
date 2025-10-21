import "./App.css";

import githubIcon from "./assets/github.png";
import { AudioContextControls } from "./components/AudioContextControls";
import { PatchWorkspace } from "./components/patch/PatchWorkspace";
import { AudioContextProvider } from "./hooks/AudioContextProvider";
import { PatchProvider } from "./modular/graph/PatchProvider";

function App() {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  return (
    <AudioContextProvider>
      <div className="app-layout">
        <div className="top-bar">
          <div className="title">Web Audio Modular Synth</div>
          <div className="actions">
            {isLocalhost && <AudioContextControls />}
          </div>
        </div>
        <div className="main-region">
          <PatchProvider>
            <PatchWorkspace />
          </PatchProvider>
        </div>
      </div>
      <a
        className="github-button"
        href="https://github.com/chasms/web-synth"
        target="_blank"
        rel="noreferrer"
      >
        <img className="github-image" src={githubIcon} />
      </a>
    </AudioContextProvider>
  );
}

export default App;
