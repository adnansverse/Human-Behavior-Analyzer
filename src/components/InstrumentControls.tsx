import React from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Activity,
  ChevronDown,
  ChevronUp,
  FlipHorizontal,
  Sparkles,
  Camera,
  Trash2,
} from 'lucide-react';
import { CameraStatus, ObservableSignals } from '../types';

interface InstrumentControlsProps {
  status: CameraStatus;
  signals: ObservableSignals;
  onStartAnalysis: () => void;
  onPauseAnalysis: () => void;
  onResumeAnalysis: () => void;
  onEndSession: () => void;
  onResetSession: () => void;
  onClearSessionData: () => void;
  onFlipCamera: () => void;
  onToggleDemoMode: () => void;
  isDemoMode: boolean;
  isDashboardOpen: boolean;
  onToggleDashboard: () => void;
  hasSessionData: boolean;
}

export const InstrumentControls: React.FC<InstrumentControlsProps> = ({
  status,
  signals,
  onStartAnalysis,
  onPauseAnalysis,
  onResumeAnalysis,
  onEndSession,
  onResetSession,
  onClearSessionData,
  onFlipCamera,
  onToggleDemoMode,
  isDemoMode,
  isDashboardOpen,
  onToggleDashboard,
  hasSessionData,
}) => {
  const isAnalyzing = status === 'analyzing';
  const isPaused = status === 'paused';
  const isReady = status === 'ready';

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Primary operational deck */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-neutral-900/75 backdrop-blur-md border border-white/10 shadow-lg">
        {/* Left: Main Session Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Start / Pause / Resume */}
          {status === 'idle' || isReady ? (
            <button
              type="button"
              onClick={onStartAnalysis}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-md transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              Start Analysis
            </button>
          ) : isAnalyzing ? (
            <button
              type="button"
              onClick={onPauseAnalysis}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-medium transition-all"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
          ) : isPaused ? (
            <button
              type="button"
              onClick={onResumeAnalysis}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-md transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              Resume
            </button>
          ) : null}

          {/* End Session Button */}
          {(isAnalyzing || isPaused || hasSessionData) && (
            <button
              type="button"
              onClick={onEndSession}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-white/10 text-xs sm:text-sm font-medium transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
              End Session
            </button>
          )}

          {/* Reset button */}
          {(hasSessionData || isPaused) && (
            <button
              type="button"
              onClick={onResetSession}
              title="Reset analysis session"
              className="p-2.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 border border-white/10 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Center/Right: Sensor mode & device switches */}
        <div className="flex items-center gap-2">
          {/* Flip / Switch Camera (Mobile) */}
          <button
            type="button"
            onClick={onFlipCamera}
            title="Switch front/rear camera"
            className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 border border-white/10 transition-colors"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Toggle Simulated Subject Feed */}
          <button
            type="button"
            onClick={onToggleDemoMode}
            title={isDemoMode ? 'Switch to hardware camera' : 'Switch to simulated subject feed'}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
              isDemoMode
                ? 'bg-cyan-950/70 border-cyan-500/30 text-cyan-300'
                : 'bg-neutral-800/80 border-white/10 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700'
            }`}
          >
            {isDemoMode ? (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Use Hardware Cam</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Simulated Feed</span>
              </>
            )}
          </button>

          {/* Clear session data if exists */}
          {hasSessionData && !isAnalyzing && (
            <button
              type="button"
              onClick={onClearSessionData}
              title="Clear all recorded session data"
              className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-rose-400 border border-white/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* DASHBOARD EXPANSION TRIGGER (MANDATORY REQUIREMENT) */}
      {/* "The detailed analysis dashboard must NOT be visible immediately. Provide a clear but elegant control such as: 'Open Dashboard'. When the user clicks it, the dashboard smoothly expands/opens." */}
      <div className="w-full flex items-center justify-center">
        <button
          type="button"
          onClick={onToggleDashboard}
          aria-expanded={isDashboardOpen}
          aria-controls="behavior-analysis-dashboard"
          className={`group flex items-center gap-3 px-5 py-2.5 rounded-full border transition-all duration-200 ${
            isDashboardOpen
              ? 'bg-neutral-850 border-cyan-500/40 text-neutral-200 shadow-md'
              : 'bg-neutral-900/90 hover:bg-neutral-850 border-white/15 text-neutral-300 hover:text-white shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs sm:text-sm font-medium tracking-wide">
              {isDashboardOpen ? 'Hide Analysis Dashboard' : 'Open Dashboard'}
            </span>
          </div>

          {/* Quick telemetry indicators when collapsed */}
          {!isDashboardOpen && (isAnalyzing || isPaused) && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10 text-xs font-mono">
              <span className="text-cyan-300 font-semibold">{signals.estimatedExpression}</span>
              <span className="text-neutral-400">•</span>
              <span className="text-emerald-400">{signals.visualAttention}% att</span>
            </div>
          )}

          {isDashboardOpen ? (
            <ChevronUp className="w-4 h-4 text-neutral-400 group-hover:text-neutral-200 transition-transform" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-400 group-hover:text-neutral-200 transition-transform" />
          )}
        </button>
      </div>
    </div>
  );
};
