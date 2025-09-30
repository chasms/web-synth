import React from "react";

import type { ModuleInstance } from "../../../modular/types";

interface MIDIInputControlsProps {
  module: ModuleInstance;
}

export const MIDIInputControls: React.FC<MIDIInputControlsProps> = ({
  module,
}) => {
  const [midiDevices, setMidiDevices] = React.useState<MIDIInput[]>([]);
  const [midiAccess, setMidiAccess] = React.useState<MIDIAccess | null>(null);

  const initial = module.getParams?.() ?? {};
  const [deviceId, setDeviceId] = React.useState<string>(
    (initial.deviceId as string) || "",
  );
  const [channel, setChannel] = React.useState<number>(
    (initial.channel as number) || 0,
  );
  const [velocityCurve, setVelocityCurve] = React.useState<string>(
    (initial.velocityCurve as string) || "linear",
  );
  const [transpose, setTranspose] = React.useState<number>(
    (initial.transpose as number) || 0,
  );

  // Initialize MIDI access
  React.useEffect(() => {
    const initMIDI = async () => {
      try {
        const access = await navigator.requestMIDIAccess();
        setMidiAccess(access);
        updateDeviceList(access);

        // Listen for device changes
        access.onstatechange = () => {
          updateDeviceList(access);
        };
      } catch (error) {
        console.warn("MIDI access failed:", error);
      }
    };

    initMIDI();
  }, []);

  const updateDeviceList = (access: MIDIAccess) => {
    const devices = Array.from(access.inputs.values());
    setMidiDevices(devices);
  };

  const handleDeviceChange = (newDeviceId: string) => {
    setDeviceId(newDeviceId);
    module.updateParams?.({ deviceId: newDeviceId });
  };

  const handleChannelChange = (newChannel: number) => {
    setChannel(newChannel);
    module.updateParams?.({ channel: newChannel });
  };

  const handleVelocityCurveChange = (newCurve: string) => {
    setVelocityCurve(newCurve);
    module.updateParams?.({ velocityCurve: newCurve });
  };

  const handleTransposeChange = (newTranspose: number) => {
    setTranspose(newTranspose);
    module.updateParams?.({ transpose: newTranspose });
  };

  return (
    <div className="midi-input-controls">
      <div className="control-row">
        <label>MIDI Device:</label>
        <select
          value={deviceId}
          onChange={(e) => handleDeviceChange(e.target.value)}
        >
          <option value="">Any Device</option>
          {midiDevices.map((device) => (
            <option key={device.id} value={device.id}>
              {device.name}
            </option>
          ))}
        </select>
      </div>

      <div className="control-row">
        <label>MIDI Channel:</label>
        <select
          value={channel}
          onChange={(e) => handleChannelChange(Number(e.target.value))}
        >
          <option value={0}>Omni</option>
          {Array.from({ length: 16 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>

      <div className="control-row">
        <label>Velocity Curve:</label>
        <select
          value={velocityCurve}
          onChange={(e) => handleVelocityCurveChange(e.target.value)}
        >
          <option value="linear">Linear</option>
          <option value="exponential">Exponential</option>
          <option value="logarithmic">Logarithmic</option>
        </select>
      </div>

      <div className="control-row">
        <label>Transpose:</label>
        <div className="number-input-container">
          <input
            type="range"
            min="-24"
            max="24"
            value={transpose}
            onChange={(e) => handleTransposeChange(Number(e.target.value))}
            className="control-slider"
          />
          <span className="value-display">
            {transpose > 0 ? `+${transpose}` : transpose}
          </span>
        </div>
      </div>

      <div className="midi-status">
        {midiAccess ? (
          <span className="status-connected">MIDI Available</span>
        ) : (
          <span className="status-disconnected">MIDI Unavailable</span>
        )}
        {deviceId && midiDevices.find((d) => d.id === deviceId) && (
          <span className="device-status">
            Connected: {midiDevices.find((d) => d.id === deviceId)?.name}
          </span>
        )}
      </div>
    </div>
  );
};
