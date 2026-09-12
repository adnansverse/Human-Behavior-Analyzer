import React, { useState } from 'react';
import { AppSettings } from '../types';
import {
  X,
  Sliders,
  Shield,
  Eye,
  Type,
  Info,
  Check,
  Trash2,
  Lock,
  Volume2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClearData: () => void;
  onClose: () => void;
}

type TabType = 'general' | 'analysis' | 'privacy' | 'accessibility' | 'about';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClearData,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [clearedConfirm, setClearedConfirm] = useState(false);

  const handleClear = () => {
    onClearData();
    setClearedConfirm(true);
    setTimeout(() => setClearedConfirm(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl p-6 flex flex-col text-neutral-100 max-h-[90vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-950 border border-white/10 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="settings-dialog-title" className="text-base font-semibold tracking-tight">
                Analyzer Configuration
              </h2>
              <p className="text-xs text-neutral-400">
                Precision tracking preferences, privacy options & interface controls
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-white/10 py-2.5 overflow-x-auto">
          {(
            [
              { id: 'general', label: 'General' },
              { id: 'analysis', label: 'Analysis' },
              { id: 'privacy', label: 'Privacy' },
              { id: 'accessibility', label: 'Accessibility' },
              { id: 'about', label: 'About' },
            ] as { id: TabType; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-white/10'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Interface & Visual Feed
                </h3>
                <p className="text-xs text-neutral-400">
                  Configure HUD overlays and telemetry feedback.
                </p>
              </div>

              {/* Show HUD overlay */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                <div>
                  <div className="text-xs font-medium text-neutral-200">Face Tracking HUD</div>
                  <div className="text-[11px] text-neutral-400">
                    Display corner framing brackets on tracked face in real time
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showHudOverlay}
                  onChange={(e) => onUpdateSettings({ showHudOverlay: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              {/* Show Gaze Vector */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                <div>
                  <div className="text-xs font-medium text-neutral-200">Visual Attention Reticle</div>
                  <div className="text-[11px] text-neutral-400">
                    Show pupil orientation and gaze axis on HUD
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showGazeVector}
                  onChange={(e) => onUpdateSettings({ showGazeVector: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              {/* Audio feedback */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                <div>
                  <div className="text-xs font-medium text-neutral-200">Subtle Audio Cues</div>
                  <div className="text-[11px] text-neutral-400">
                    Soft audible chimes on session start, pause, and major baseline changes
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableSubtleAudio}
                  onChange={(e) => onUpdateSettings({ enableSubtleAudio: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-cyan-500 focus:ring-cyan-500"
                />
              </label>
            </div>
          )}

          {/* ANALYSIS TAB */}
          {activeTab === 'analysis' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Analytical Parameters
                </h3>
                <p className="text-xs text-neutral-400">
                  Adjust observation sensitivities and comparison baseline window.
                </p>
              </div>

              {/* Sensitivity */}
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-neutral-200">Behavior-Change Sensitivity</span>
                  <span className="font-mono text-cyan-300 uppercase text-[11px]">
                    {settings.sensitivity}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'balanced', 'high'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onUpdateSettings({ sensitivity: s })}
                      className={`py-1.5 rounded-lg text-xs font-medium capitalize border transition-all ${
                        settings.sensitivity === s
                          ? 'bg-neutral-800 text-cyan-300 border-cyan-500/40'
                          : 'bg-neutral-900 text-neutral-400 border-white/5 hover:text-neutral-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Baseline Window */}
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-neutral-200">Rolling Baseline Window</span>
                  <span className="font-mono text-cyan-300 text-[11px]">
                    {settings.baselineWindowSeconds} Seconds
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([15, 30, 60] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => onUpdateSettings({ baselineWindowSeconds: sec })}
                      className={`py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        settings.baselineWindowSeconds === sec
                          ? 'bg-neutral-800 text-cyan-300 border-cyan-500/40'
                          : 'bg-neutral-900 text-neutral-400 border-white/5 hover:text-neutral-200'
                      }`}
                    >
                      {sec}s Window
                    </button>
                  ))}
                </div>
              </div>

              {/* Sampling Rate */}
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-neutral-200">Sensor Frame Sampling Rate</span>
                  <span className="font-mono text-cyan-300 text-[11px]">
                    {settings.samplingRateHz} Hz
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([2, 5, 10] as const).map((hz) => (
                    <button
                      key={hz}
                      type="button"
                      onClick={() => onUpdateSettings({ samplingRateHz: hz })}
                      className={`py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        settings.samplingRateHz === hz
                          ? 'bg-neutral-800 text-cyan-300 border-cyan-500/40'
                          : 'bg-neutral-900 text-neutral-400 border-white/5 hover:text-neutral-200'
                      }`}
                    >
                      {hz} Hz
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Data Security & Privacy Principles
                </h3>
                <p className="text-xs text-neutral-400">
                  This instrument adheres to strict client-side data sovereignty.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-white/5 space-y-2 text-xs text-neutral-300 leading-relaxed">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Lock className="w-4 h-4" />
                  <span>100% In-Browser Local Processing</span>
                </div>
                <p className="text-neutral-400">
                  Video feed frames are processed strictly in volatile GPU/canvas memory in your browser. No image, video stream, or biometric facial signature is ever sent to a remote server, third-party cloud, or external database.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-white/5 space-y-2 text-xs text-neutral-300">
                <div className="font-semibold text-neutral-200">No Identity or Deception Analysis</div>
                <p className="text-neutral-400">
                  The application does not perform identity recognition, lie detection, or psychological diagnoses. It tracks observable surface changes and visual orientation signals only.
                </p>
              </div>

              {/* Clear session data */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors"
                >
                  {clearedConfirm ? <Check className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  <span>{clearedConfirm ? 'Session Data Cleared' : 'Clear All Current Session Data'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ACCESSIBILITY TAB */}
          {activeTab === 'accessibility' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Accessibility & Motion
                </h3>
                <p className="text-xs text-neutral-400">
                  Tune display contrast, text scale, and motion preferences.
                </p>
              </div>

              {/* Reduced Motion */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                <div>
                  <div className="text-xs font-medium text-neutral-200">Reduced Motion</div>
                  <div className="text-[11px] text-neutral-400">
                    Disables transition animations and HUD pulsation effects
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => onUpdateSettings({ reducedMotion: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-cyan-500 focus:ring-cyan-500"
                />
              </label>

              {/* Text Size */}
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-neutral-200">Typography Scale</span>
                  <span className="font-mono text-cyan-300 uppercase text-[11px]">
                    {settings.fontSize}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['standard', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => onUpdateSettings({ fontSize: size })}
                      className={`py-1.5 rounded-lg text-xs capitalize border transition-all ${
                        settings.fontSize === size
                          ? 'bg-neutral-800 text-cyan-300 border-cyan-500/40'
                          : 'bg-neutral-900 text-neutral-400 border-white/5 hover:text-neutral-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* High Contrast */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                <div>
                  <div className="text-xs font-medium text-neutral-200">High Contrast Palette</div>
                  <div className="text-[11px] text-neutral-400">
                    Increases panel borders and text contrast for maximum visibility
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) => onUpdateSettings({ highContrast: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-cyan-500 focus:ring-cyan-500"
                />
              </label>
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  About Human Behavior Analyzer
                </h3>
                <p className="text-xs text-neutral-400">
                  Version 1.0.4 • Specialized behavioral instrument
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-white/5 text-xs text-neutral-300 space-y-2 leading-relaxed">
                <p>
                  The Human Behavior Analyzer evaluates observable human facial geometry and visual attention signals in real time using local computer vision heuristics.
                </p>
                <p className="text-neutral-400 text-[11px]">
                  Engineered with an emphasis on scientific prudence: observable surface movements do not equate to subjective internal psychological experiences.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-neutral-400">
                <div className="p-2.5 rounded-lg bg-neutral-950/40 border border-white/5">
                  <span className="block text-[10px] text-neutral-400">ARCHITECTURE</span>
                  <span className="text-neutral-200">Client-Side React + CV</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950/40 border border-white/5">
                  <span className="block text-[10px] text-neutral-400">DEVICE LATENCY</span>
                  <span className="text-cyan-300 font-bold">&lt; 20 ms</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION OF SETTINGS: Clearly & Elegantly Displays "Adnan's work" */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Subtle, elegant signature as requested */}
          <div className="flex items-center gap-2 text-neutral-400 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80" />
            <span className="tracking-wide">Designed & Crafted:</span>
            <span className="text-neutral-200 font-semibold tracking-wider">
              Adnan&apos;s work
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium border border-white/10 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
