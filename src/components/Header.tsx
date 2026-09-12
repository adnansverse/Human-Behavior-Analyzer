import React from 'react';
import { Camera, Settings, ShieldCheck, Activity, Volume2, VolumeX, Eye } from 'lucide-react';
import { CameraStatus } from '../types';
import { formatTime } from '../services/analyzer';

interface HeaderProps {
  status: CameraStatus;
  elapsedSeconds: number;
  onOpenSettings: () => void;
  onOpenPrivacyInfo: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  isDashboardOpen: boolean;
  onToggleDashboard: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  elapsedSeconds,
  onOpenSettings,
  onOpenPrivacyInfo,
  audioEnabled,
  onToggleAudio,
  isDashboardOpen,
  onToggleDashboard,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'analyzing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/70 border border-emerald-500/30 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Analyzing Observable Signals
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/60 border border-amber-500/30 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Analysis Paused
          </span>
        );
      case 'connecting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Connecting Camera…
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-800/80 border border-neutral-700 text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Camera Ready
          </span>
        );
      case 'permission-denied':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-950/70 border border-rose-500/30 text-rose-400">
            Permission Required
          </span>
        );
      case 'multiple-faces':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/70 border border-amber-500/30 text-amber-300">
            Multiple Faces Detected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-900 border border-neutral-800 text-neutral-400">
            Standby
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-neutral-950/80 backdrop-blur-md px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-900 border border-white/10 text-neutral-200 shadow-sm">
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold tracking-tight text-neutral-100">
                Human Behavior Analyzer
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-wider text-neutral-400 bg-neutral-900 rounded border border-neutral-800">
                Instrument v1.0
              </span>
            </div>
            <p className="hidden md:block text-xs text-neutral-400">
              Observable facial signals & visual attention tracking
            </p>
          </div>
        </div>

        {/* Center telemetry: Timer & Status */}
        <div className="flex items-center gap-3">
          {getStatusBadge()}

          {status === 'analyzing' || status === 'paused' ? (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-neutral-900/90 border border-white/10 text-xs font-mono text-neutral-200">
              <span className="text-neutral-400 text-[11px]">SESSION:</span>
              <span className="font-semibold text-cyan-300">{formatTime(elapsedSeconds)}</span>
            </div>
          ) : null}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick toggle for Dashboard on header */}
          <button
            type="button"
            onClick={onToggleDashboard}
            aria-label={isDashboardOpen ? 'Hide dashboard' : 'Open dashboard'}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isDashboardOpen
                ? 'bg-neutral-800 border-neutral-600 text-neutral-100 shadow-inner'
                : 'bg-neutral-900/90 border-white/10 text-neutral-300 hover:bg-neutral-850 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isDashboardOpen ? 'Hide Dashboard' : 'Open Dashboard'}</span>
          </button>

          {/* Audio toggle */}
          <button
            type="button"
            onClick={onToggleAudio}
            title={audioEnabled ? 'Subtle audio cues enabled' : 'Subtle audio cues muted'}
            aria-label={audioEnabled ? 'Mute audio cues' : 'Enable audio cues'}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent hover:border-white/10 transition-colors"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
          </button>

          {/* Privacy info button */}
          <button
            type="button"
            onClick={onOpenPrivacyInfo}
            title="Privacy & Non-Diagnostic Guarantee"
            aria-label="View privacy and scientific policy"
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent hover:border-white/10 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400/80" />
          </button>

          {/* Settings button */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Analyzer Settings"
            aria-label="Open settings"
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent hover:border-white/10 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
